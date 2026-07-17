import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeCatalogType, OvertimeRequestType, OvertimeStatus, Prisma } from '@prisma/client';

import { EmployeeCatalogRepository } from '../../payroll/repository/employee-catalog.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdministrativeOvertimeBatchResult,
  CreateAdministrativeOvertimeBatchInput,
  CreateAdministrativeOvertimeRequestData,
  OvertimeActorContext,
  OvertimeRequestRecord,
} from '../interfaces/overtime.interfaces';
import { OVERTIME_ADMIN_REQUESTER_POSITION_IDS } from '../overtime-approval.constants';
import { OvertimeNotificationService } from './overtime-notification.service';
import { OvertimeRepository } from '../repository/overtime.repository';
import {
  calculateProposedMinutes,
  derivePayrollPeriodFromWorkDate,
  isProposedStartOnWorkDate,
  workDateToIso,
} from '../utils/admin-overtime-window.util';

@Injectable()
export class OvertimeAdminCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: OvertimeRepository,
    private readonly employeeCatalogRepository: EmployeeCatalogRepository,
    private readonly notificationService: OvertimeNotificationService,
  ) {}

  async createAdministrativeBatch(
    tenantId: string,
    actorUserId: string,
    input: CreateAdministrativeOvertimeBatchInput,
  ): Promise<AdministrativeOvertimeBatchResult> {
    const employeeIds = this.normalizeEmployeeIds(input.employeeIds);
    const { workDate, proposedStartTime, proposedEndTime, proposedMinutes, payrollPeriod } =
      this.validateWindow(input);

    const actor = await this.assertRequesterCanCreate(tenantId, actorUserId, input.locationId);
    await this.assertLocationActive(tenantId, input.locationId);
    await this.assertEmployeesEligible(tenantId, employeeIds, input.locationId);
    await this.assertReasonActive(tenantId, input.reasonOptionId);

    const batchId = randomUUID();
    const rows: CreateAdministrativeOvertimeRequestData[] = employeeIds.map(
      (employeeId): CreateAdministrativeOvertimeRequestData => ({
        employeeId,
        locationId: input.locationId,
        payrollPeriod,
        workDate,
        proposedStartTime,
        proposedEndTime,
        proposedMinutes,
        reasonOptionId: input.reasonOptionId,
        requestedByUserId: actor.userId,
        batchId,
        type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
        status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      }),
    );

    let created: OvertimeRequestRecord[];
    try {
      created = await this.prisma.$transaction(async (tx): Promise<OvertimeRequestRecord[]> => {
        for (const employeeId of employeeIds) {
          const overlaps = await this.repository.findOverlappingAdministrativeWindows(
            tenantId,
            {
              employeeId,
              locationId: input.locationId,
              proposedStartTime,
              proposedEndTime,
            },
            tx,
          );
          if (overlaps.length > 0) {
            throw this.buildOverlapConflict(
              employeeId,
              proposedStartTime,
              proposedEndTime,
              overlaps[0],
            );
          }
        }

        return this.repository.createAdministrativeRequests(tenantId, rows, tx);
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe una solicitud administrativa activa con la misma ventana para uno de los empleados',
        );
      }
      throw error;
    }

    await Promise.all(
      created.map(
        (request): Promise<void> =>
          this.notificationService
            .notifyLevelPending(tenantId, request.id, OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES)
            .catch((): undefined => undefined),
      ),
    );

    return { batchId, items: created };
  }

  private normalizeEmployeeIds(employeeIds: string[]): string[] {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new BadRequestException('Debe indicar al menos un empleado');
    }
    const normalized = employeeIds
      .map((id): string => id?.trim() ?? '')
      .filter((id): id is string => id.length > 0);
    if (normalized.length === 0) {
      throw new BadRequestException('Debe indicar al menos un empleado');
    }
    if (new Set(normalized).size !== normalized.length) {
      throw new BadRequestException('employeeIds no puede contener duplicados');
    }
    return normalized;
  }

  private validateWindow(input: CreateAdministrativeOvertimeBatchInput): {
    workDate: Date;
    proposedStartTime: Date;
    proposedEndTime: Date;
    proposedMinutes: number;
    payrollPeriod: string;
  } {
    const workDate = input.workDate instanceof Date ? input.workDate : new Date(input.workDate);
    const proposedStartTime =
      input.proposedStartTime instanceof Date
        ? input.proposedStartTime
        : new Date(input.proposedStartTime);
    const proposedEndTime =
      input.proposedEndTime instanceof Date
        ? input.proposedEndTime
        : new Date(input.proposedEndTime);

    if (Number.isNaN(workDate.getTime())) {
      throw new BadRequestException('workDate inválida');
    }
    if (Number.isNaN(proposedStartTime.getTime()) || Number.isNaN(proposedEndTime.getTime())) {
      throw new BadRequestException('proposedStartTime y proposedEndTime deben ser fechas válidas');
    }
    if (proposedEndTime.getTime() <= proposedStartTime.getTime()) {
      throw new BadRequestException('proposedEndTime debe ser posterior a proposedStartTime');
    }

    const proposedMinutes = calculateProposedMinutes(proposedStartTime, proposedEndTime);
    if (proposedMinutes < 1) {
      throw new BadRequestException('La ventana propuesta debe durar al menos 1 minuto');
    }

    if (!isProposedStartOnWorkDate(workDate, proposedStartTime)) {
      throw new BadRequestException(
        `proposedStartTime debe caer en workDate (${workDateToIso(workDate)}) zona America/Bogota`,
      );
    }

    return {
      workDate,
      proposedStartTime,
      proposedEndTime,
      proposedMinutes,
      payrollPeriod: derivePayrollPeriodFromWorkDate(workDate),
    };
  }

  private async assertRequesterCanCreate(
    tenantId: string,
    actorUserId: string,
    locationId: string,
  ): Promise<OvertimeActorContext> {
    const actor = await this.repository.findActorContext(tenantId, actorUserId);
    if (!actor) {
      throw new ForbiddenException('Usuario solicitante no encontrado o inactivo');
    }

    if (
      !actor.positionId ||
      !(OVERTIME_ADMIN_REQUESTER_POSITION_IDS as readonly string[]).includes(actor.positionId)
    ) {
      throw new ForbiddenException(
        'Solo un Administrador de sede puede crear solicitudes administrativas de extensión',
      );
    }

    if (!actor.locationIds.includes(locationId)) {
      throw new ForbiddenException('El solicitante no tiene acceso a la sede indicada');
    }

    return actor;
  }

  private async assertLocationActive(tenantId: string, locationId: string): Promise<void> {
    const location = await this.repository.findActiveLocationById(tenantId, locationId);
    if (!location) {
      throw new NotFoundException(`Sede ${locationId} no encontrada o inactiva`);
    }
  }

  private async assertEmployeesEligible(
    tenantId: string,
    employeeIds: string[],
    locationId: string,
  ): Promise<void> {
    const rows = await this.repository.findActiveEmployeesByIds(tenantId, employeeIds);
    const byId = new Map(rows.map((row): [string, (typeof rows)[number]] => [row.id, row]));

    for (const employeeId of employeeIds) {
      const employee = byId.get(employeeId);
      if (!employee) {
        throw new BadRequestException(
          `Empleado ${employeeId} no existe en el tenant, está eliminado o no es válido`,
        );
      }
      if (!employee.isActive) {
        throw new BadRequestException(`Empleado ${employeeId} está inactivo`);
      }
      if (employee.locationId !== locationId) {
        throw new BadRequestException(
          `Empleado ${employeeId} no está asignado a la sede ${locationId}`,
        );
      }
    }
  }

  private async assertReasonActive(tenantId: string, reasonOptionId: string): Promise<void> {
    const reason = await this.employeeCatalogRepository.findActiveByIdAndType(
      tenantId,
      reasonOptionId,
      EmployeeCatalogType.OVERTIME_REASON,
    );
    if (!reason) {
      throw new BadRequestException(
        'Motivo inválido: debe ser un OVERTIME_REASON activo del tenant',
      );
    }
  }

  private buildOverlapConflict(
    employeeId: string,
    proposedStartTime: Date,
    proposedEndTime: Date,
    conflicting: OvertimeRequestRecord,
  ): ConflictException {
    return new ConflictException({
      message: 'La ventana propuesta se solapa con una solicitud administrativa activa',
      employeeId,
      proposedStartTime: proposedStartTime.toISOString(),
      proposedEndTime: proposedEndTime.toISOString(),
      conflictingRequestId: conflicting.id,
      conflictingStatus: conflicting.status,
      conflictingProposedStartTime: conflicting.proposedStartTime?.toISOString() ?? null,
      conflictingProposedEndTime: conflicting.proposedEndTime?.toISOString() ?? null,
    });
  }
}
