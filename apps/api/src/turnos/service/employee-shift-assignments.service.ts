import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import type {
  EmployeeShiftAssignmentRecord,
  IEmployeeShiftAssignmentsService,
} from '../interfaces/employee-shift-assignment.interfaces';
import type { ActorContext } from '../interfaces/turno-assignments.interfaces';
import { EmployeeShiftAssignmentsRepository } from '../repository/employee-shift-assignments.repository';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { addDaysUtc, formatDateOnly, parseDateOnly } from '../turno-assignments.utils';
import {
  SCOPE_FORBIDDEN_MESSAGE,
  TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES,
} from '../turnos.constants';

@Injectable()
export class EmployeeShiftAssignmentsService implements IEmployeeShiftAssignmentsService {
  constructor(
    private readonly repository: EmployeeShiftAssignmentsRepository,
    private readonly turnoAssignmentsRepository: TurnoAssignmentsRepository,
    private readonly userLocationsService: UserLocationsService,
  ) {}

  async listByEmployee(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
  ): Promise<EmployeeShiftAssignmentRecord[]> {
    await this.assertEmployeeAccess(tenantId, actor, employeeId);
    return this.repository.findByEmployee(tenantId, employeeId);
  }

  async create(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
    input: { turnoId: string; effectiveFrom: string },
  ): Promise<EmployeeShiftAssignmentRecord> {
    const effectiveFrom = parseDateOnly(input.effectiveFrom);
    await this.assertEmployeeAccess(tenantId, actor, employeeId);

    const turno = await this.turnoAssignmentsRepository.findTurnoScope(tenantId, input.turnoId);
    if (!turno) {
      throw new NotFoundException(`Turno "${input.turnoId}" no encontrado`);
    }
    if (!turno.estado) {
      throw new ConflictException('El turno seleccionado está inactivo');
    }

    const employee = await this.turnoAssignmentsRepository.findEmployeeScope(tenantId, employeeId);
    if (!employee?.isActive) {
      throw new ConflictException('No se puede asignar turno a un colaborador inactivo');
    }

    const openAssignment = await this.repository.findOpenByEmployee(tenantId, employeeId);
    let closePreviousId: string | null = null;
    let previousEffectiveTo: Date | null = null;

    if (openAssignment) {
      if (effectiveFrom.getTime() <= openAssignment.effectiveFrom.getTime()) {
        throw new ConflictException(
          'effectiveFrom debe ser posterior al inicio de la asignación vigente',
        );
      }
      closePreviousId = openAssignment.id;
      previousEffectiveTo = addDaysUtc(effectiveFrom, -1);
    }

    const overlaps = await this.repository.hasOverlappingAssignment(
      tenantId,
      employeeId,
      effectiveFrom,
      null,
      openAssignment?.id,
    );
    if (overlaps) {
      throw new ConflictException(
        'Ya existe una asignación vigente que se solapa con la fecha indicada',
      );
    }

    return this.repository.createWithAudit(
      tenantId,
      employeeId,
      { turnoId: input.turnoId, effectiveFrom },
      actor.userId,
      {
        employeeId,
        turnoId: input.turnoId,
        turnoSigla: turno.sigla,
        effectiveFrom: formatDateOnly(effectiveFrom),
      },
      closePreviousId,
      previousEffectiveTo,
    );
  }

  async patch(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
    id: string,
    input: { effectiveTo?: string; turnoId?: string; effectiveFrom?: string },
  ): Promise<EmployeeShiftAssignmentRecord> {
    await this.assertEmployeeAccess(tenantId, actor, employeeId);

    const current = await this.repository.findById(tenantId, id);
    if (!current || current.employeeId !== employeeId) {
      throw new NotFoundException(`Asignación "${id}" no encontrada`);
    }

    const patchData: {
      effectiveTo?: Date;
      turnoId?: string;
      effectiveFrom?: Date;
    } = {};

    if (input.effectiveTo !== undefined) {
      patchData.effectiveTo = parseDateOnly(input.effectiveTo);
      if (patchData.effectiveTo.getTime() < current.effectiveFrom.getTime()) {
        throw new BadRequestException('effectiveTo no puede ser anterior a effectiveFrom');
      }
    }

    if (input.effectiveFrom !== undefined) {
      patchData.effectiveFrom = parseDateOnly(input.effectiveFrom);
    }

    if (input.turnoId !== undefined) {
      const turno = await this.turnoAssignmentsRepository.findTurnoScope(tenantId, input.turnoId);
      if (!turno) {
        throw new NotFoundException(`Turno "${input.turnoId}" no encontrado`);
      }
      if (!turno.estado) {
        throw new ConflictException('El turno seleccionado está inactivo');
      }
      patchData.turnoId = input.turnoId;
    }

    const nextFrom = patchData.effectiveFrom ?? current.effectiveFrom;
    const nextTo =
      patchData.effectiveTo !== undefined ? patchData.effectiveTo : current.effectiveTo;

    const overlaps = await this.repository.hasOverlappingAssignment(
      tenantId,
      employeeId,
      nextFrom,
      nextTo,
      id,
    );
    if (overlaps) {
      throw new ConflictException('La vigencia actualizada se solapa con otra asignación');
    }

    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};

    if (patchData.effectiveFrom) {
      oldValue.effectiveFrom = formatDateOnly(current.effectiveFrom);
      newValue.effectiveFrom = formatDateOnly(patchData.effectiveFrom);
    }
    if (patchData.effectiveTo !== undefined) {
      oldValue.effectiveTo = current.effectiveTo ? formatDateOnly(current.effectiveTo) : null;
      newValue.effectiveTo = patchData.effectiveTo ? formatDateOnly(patchData.effectiveTo) : null;
    }
    if (patchData.turnoId) {
      oldValue.turnoId = current.turnoId;
      newValue.turnoId = patchData.turnoId;
    }

    return this.repository.updateWithAudit(tenantId, id, patchData, actor.userId, {
      oldValue,
      newValue,
    });
  }

  private async assertEmployeeAccess(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
  ): Promise<void> {
    const employee = await this.turnoAssignmentsRepository.findEmployeeScope(tenantId, employeeId);
    if (!employee) {
      throw new NotFoundException(`Colaborador "${employeeId}" no encontrado`);
    }

    const isLocationScoped = (
      TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES as readonly string[]
    ).includes(actor.roleCode);
    if (!isLocationScoped) {
      return;
    }

    const allowedLocationIds = await this.userLocationsService.getActiveUserLocations(
      tenantId,
      actor.userId,
    );
    const allowed = allowedLocationIds.map((location) => location.id);
    // Rotante (sin sede fija): un actor acotado por sede no tiene forma de validar
    // pertenencia contra una sede estática — se niega por defecto (fail-closed).
    if (!employee.locationId || !allowed.includes(employee.locationId)) {
      throw new ForbiddenException(SCOPE_FORBIDDEN_MESSAGE);
    }
  }
}
