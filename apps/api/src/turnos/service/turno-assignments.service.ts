import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TurnoAssignmentType } from '@prisma/client';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import type {
  ActorContext,
  AssignmentAuditChangeSet,
  ITurnoAssignmentsService,
  ListWeeklyAssignmentsOptions,
  TurnoAssignmentRecord,
  WeeklyAssignmentCell,
  WeeklyAssignmentsResult,
} from '../interfaces/turno-assignments.interfaces';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import {
  buildWeekDates,
  formatDateOnly,
  getMondayOfWeek,
  parseDateOnly,
} from '../turno-assignments.utils';
import {
  TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES,
  TURNO_ASSIGNMENTS_PAST_DATE_OVERRIDE_ROLES,
} from '../turnos.constants';
import { startOfTodayUtc } from '../turnos.utils';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

@Injectable()
export class TurnoAssignmentsService implements ITurnoAssignmentsService {
  constructor(
    private readonly repository: TurnoAssignmentsRepository,
    private readonly userLocationsService: UserLocationsService,
  ) {}

  async getWeekly(
    tenantId: string,
    actor: ActorContext,
    options: Omit<ListWeeklyAssignmentsOptions, 'allowedLocationIds'>,
  ): Promise<WeeklyAssignmentsResult> {
    const allowedLocationIds = await this.resolveScope(tenantId, actor);
    const weekStart = getMondayOfWeek(options.weekStart);
    const dates = buildWeekDates(weekStart);
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));

    const { employees, total } = await this.repository.findActiveEmployeesPage(tenantId, {
      search: options.search,
      field: options.field,
      page,
      limit,
      allowedLocationIds,
    });

    const employeeIds = employees.map((employee): string => employee.id);
    const assignments = await this.repository.findAssignmentsForEmployeesInRange(
      tenantId,
      employeeIds,
      dates[0],
      dates[dates.length - 1],
    );

    const assignmentsByKey = new Map<string, TurnoAssignmentRecord>();
    for (const assignment of assignments) {
      const key = `${assignment.employeeId}|${formatDateOnly(assignment.workDate)}`;
      assignmentsByKey.set(key, assignment);
    }

    const dateStrings = dates.map((date): string => formatDateOnly(date));

    return {
      weekStart: formatDateOnly(weekStart),
      dates: dateStrings,
      colaboradores: employees.map(
        (employee): WeeklyAssignmentsResult['colaboradores'][number] => ({
          id: employee.id,
          userId: employee.userId,
          nombre: employee.nombre,
          documento: employee.documento,
          locationId: employee.locationId,
          turnos: dateStrings.map(
            (dateStr): WeeklyAssignmentCell =>
              this.buildCell(dateStr, assignmentsByKey.get(`${employee.id}|${dateStr}`)),
          ),
        }),
      ),
      pagination: { total, page, limit },
    };
  }

  async assign(
    tenantId: string,
    actor: ActorContext,
    input: { employeeId: string; workDate: string; turnoId?: string; type?: TurnoAssignmentType },
  ): Promise<TurnoAssignmentRecord> {
    const type = input.type ?? TurnoAssignmentType.ASSIGNED;
    this.validateAssignInput(type, input.turnoId);

    const workDate = parseDateOnly(input.workDate);
    this.assertPastDateAllowed(workDate, actor);

    const employee = await this.repository.findEmployeeScope(tenantId, input.employeeId);
    if (!employee) {
      throw new NotFoundException(`Colaborador "${input.employeeId}" no encontrado`);
    }
    if (!employee.isActive) {
      throw new ConflictException('No se puede asignar un turno a un colaborador inactivo');
    }

    await this.assertLocationAllowed(tenantId, actor, employee.locationId);

    let turnoId: string | null = null;
    if (type === TurnoAssignmentType.ASSIGNED) {
      const turno = await this.repository.findTurnoScope(tenantId, input.turnoId as string);
      if (!turno) {
        throw new NotFoundException(`Turno "${input.turnoId}" no encontrado`);
      }
      if (!turno.estado) {
        throw new ConflictException('El turno seleccionado está inactivo');
      }
      turnoId = turno.id;
    }

    const existing = await this.repository.findByEmployeeAndDate(
      tenantId,
      input.employeeId,
      workDate,
    );
    const auditChanges = this.buildAuditChanges(input.employeeId, workDate, existing, {
      type,
      turnoId,
    });

    return this.repository.upsertWithAudit(
      tenantId,
      { employeeId: input.employeeId, workDate, type, turnoId },
      actor.userId,
      auditChanges,
    );
  }

  async remove(tenantId: string, actor: ActorContext, id: string): Promise<void> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Asignación "${id}" no encontrada`);
    }

    this.assertPastDateAllowed(existing.workDate, actor);

    const employee = await this.repository.findEmployeeScope(tenantId, existing.employeeId);
    if (employee) {
      await this.assertLocationAllowed(tenantId, actor, employee.locationId);
    }

    const auditChanges = this.buildAuditChanges(
      existing.employeeId,
      existing.workDate,
      existing,
      null,
    );

    await this.repository.deleteWithAudit(tenantId, id, actor.userId, auditChanges);
  }

  private validateAssignInput(type: TurnoAssignmentType, turnoId: string | undefined): void {
    if (type === TurnoAssignmentType.ASSIGNED && !turnoId) {
      throw new BadRequestException('turnoId es obligatorio cuando type es ASSIGNED');
    }
    if (type === TurnoAssignmentType.REST && turnoId) {
      throw new BadRequestException('turnoId debe omitirse cuando type es REST');
    }
  }

  private assertPastDateAllowed(workDate: Date, actor: ActorContext): void {
    const isPast = workDate.getTime() < startOfTodayUtc().getTime();
    const canOverride = (TURNO_ASSIGNMENTS_PAST_DATE_OVERRIDE_ROLES as readonly string[]).includes(
      actor.roleCode,
    );
    if (isPast && !canOverride) {
      throw new ForbiddenException('No se pueden modificar asignaciones de fechas pasadas');
    }
  }

  private async assertLocationAllowed(
    tenantId: string,
    actor: ActorContext,
    employeeLocationId: string,
  ): Promise<void> {
    const allowedLocationIds = await this.resolveScope(tenantId, actor);
    if (allowedLocationIds && !allowedLocationIds.includes(employeeLocationId)) {
      throw new ForbiddenException(
        'El colaborador no pertenece a una sede asignada a este usuario',
      );
    }
  }

  private async resolveScope(tenantId: string, actor: ActorContext): Promise<string[] | null> {
    const isLocationScoped = (
      TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES as readonly string[]
    ).includes(actor.roleCode);
    if (!isLocationScoped) {
      return null;
    }

    const locations = await this.userLocationsService.getActiveUserLocations(
      tenantId,
      actor.userId,
    );
    return locations.map((location): string => location.id);
  }

  private buildAuditChanges(
    employeeId: string,
    workDate: Date,
    previous: TurnoAssignmentRecord | null,
    next: { type: TurnoAssignmentType; turnoId: string | null } | null,
  ): AssignmentAuditChangeSet {
    const workDateStr = formatDateOnly(workDate);

    return {
      oldValue: {
        employeeId,
        workDate: workDateStr,
        type: previous?.type ?? null,
        turnoId: previous?.turnoId ?? null,
        turnoSigla: previous?.turno?.sigla ?? null,
      },
      newValue: next
        ? {
            employeeId,
            workDate: workDateStr,
            type: next.type,
            turnoId: next.turnoId,
          }
        : {
            employeeId,
            workDate: workDateStr,
            type: null,
            turnoId: null,
          },
    };
  }

  private buildCell(
    dateStr: string,
    assignment: TurnoAssignmentRecord | undefined,
  ): WeeklyAssignmentCell {
    if (!assignment) {
      return {
        fecha: dateStr,
        type: 'BASE',
        turno: null,
        esDescanso: false,
        turnoBase: true,
      };
    }

    if (assignment.type === TurnoAssignmentType.REST) {
      return {
        fecha: dateStr,
        assignmentId: assignment.id,
        type: 'REST',
        turno: null,
        esDescanso: true,
        turnoBase: false,
      };
    }

    return {
      fecha: dateStr,
      assignmentId: assignment.id,
      type: 'ASSIGNED',
      turno: assignment.turno,
      esDescanso: false,
      turnoBase: false,
    };
  }
}
