import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceLog, AttendanceLogSource, AttendanceObservation } from '@prisma/client';
import { AuditService } from '../../audit/service/audit.service';
import { ATTENDANCE_CARD_HISTORY_LIMIT } from '../attendance.constants';
import type {
  AttendanceActingUser,
  AttendanceCardResult,
  CreateManualMarkingInput,
  EmployeeWithUser,
  UpsertObservationInput,
} from '../interfaces/attendance.interfaces';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { AttendanceRepository, normalizeWorkDate } from '../repository/attendance.repository';
import { AttendanceService } from './attendance.service';
import {
  isCardDateRangeWithinLimit,
  parseCalendarDate,
} from '../utils/attendance-calculation.util';

@Injectable()
export class AttendanceCardService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditService: AuditService,
    private readonly attendanceService: AttendanceService,
    private readonly userLocationsService: UserLocationsService,
  ) {}

  async getCard(
    userId: string,
    tenantId: string,
    dateFrom: string,
    dateTo: string,
    actor: AttendanceActingUser,
  ): Promise<AttendanceCardResult> {
    const employee = await this.requireEmployee(userId, tenantId);
    await this.assertEmployeeLocationAllowed(tenantId, actor, employee.locationId);
    const from = parseCalendarDate(dateFrom);
    const to = parseCalendarDate(dateTo);
    this.assertDateRange(from, to);

    const [logs, observations] = await Promise.all([
      this.attendanceRepository.listHistory({
        tenantId,
        employeeId: employee.id,
        dateFrom: from,
        dateTo: to,
        limit: ATTENDANCE_CARD_HISTORY_LIMIT,
      }),
      this.attendanceRepository.listObservationsInRange(tenantId, employee.id, from, to),
    ]);

    return { logs, observations };
  }

  async upsertObservation(
    userId: string,
    tenantId: string,
    actingUser: AttendanceActingUser,
    input: UpsertObservationInput,
  ): Promise<AttendanceObservation> {
    const employee = await this.requireEmployee(userId, tenantId);
    await this.assertEmployeeLocationAllowed(tenantId, actingUser, employee.locationId);

    const workDate = parseCalendarDate(input.workDate);
    const existing = await this.attendanceRepository.findObservation(
      tenantId,
      employee.id,
      workDate,
    );

    const observation = await this.attendanceRepository.upsertObservation(
      tenantId,
      employee.id,
      workDate,
      input.note,
      actingUser.sub,
    );

    await this.auditService.log({
      tenantId,
      action: existing ? 'UPDATE' : 'CREATE',
      entityType: 'AttendanceObservation',
      entityId: observation.id,
      actorUserId: actingUser.sub,
      oldValue: existing ? { note: existing.note } : null,
      newValue: { note: observation.note },
      payload: { employeeId: employee.id, workDate: input.workDate },
    });

    return observation;
  }

  async createManualMarking(
    userId: string,
    tenantId: string,
    actingUser: AttendanceActingUser,
    input: CreateManualMarkingInput,
  ): Promise<AttendanceLog> {
    const employee = await this.requireEmployee(userId, tenantId);
    await this.assertEmployeeLocationAllowed(tenantId, actingUser, employee.locationId);

    const workDate = parseCalendarDate(input.workDate);
    const timestamp = new Date(input.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new BadRequestException('timestamp inválido');
    }
    this.assertTimestampWithinWorkDate(workDate, timestamp, input.eventType);

    let parentLog: AttendanceLog | null = null;
    if (input.parentLogId) {
      parentLog = await this.attendanceRepository.findLogById(input.parentLogId, tenantId);
      if (!parentLog) {
        throw new BadRequestException('parentLogId no existe en este tenant');
      }
      if (parentLog.employeeId !== employee.id) {
        throw new BadRequestException('parentLogId no pertenece a este empleado');
      }
    }

    const created = await this.attendanceService.registerEvent({
      tenantId,
      employeeId: employee.id,
      locationId: employee.locationId,
      eventType: input.eventType,
      source: AttendanceLogSource.MANUAL,
      workDate,
      timestamp,
      createdByUserId: actingUser.sub,
      manualReason: input.reason,
      manualParentLogId: parentLog?.id ?? null,
    });

    await this.auditService.log({
      tenantId,
      action: 'CREATE',
      entityType: 'AttendanceLog',
      entityId: created.id,
      actorUserId: actingUser.sub,
      oldValue: parentLog ? this.serializeLog(parentLog) : null,
      newValue: this.serializeLog(created),
      payload: { reason: input.reason, parentLogId: input.parentLogId ?? null },
    });

    return created;
  }

  async deleteManualMarking(
    logId: string,
    tenantId: string,
    actingUser: AttendanceActingUser,
  ): Promise<void> {
    const log = await this.attendanceRepository.findLogById(logId, tenantId);
    if (!log) {
      throw new NotFoundException(`Marcación "${logId}" no encontrada`);
    }
    if (log.source !== AttendanceLogSource.MANUAL) {
      throw new ForbiddenException('Solo se pueden eliminar marcaciones manuales (source=MANUAL)');
    }

    await this.assertEmployeeLocationAllowed(tenantId, actingUser, log.employee.locationId);

    await this.attendanceRepository.deleteManualLog(logId, tenantId);

    await this.auditService.log({
      tenantId,
      action: 'DELETE',
      entityType: 'AttendanceLog',
      entityId: logId,
      actorUserId: actingUser.sub,
      oldValue: this.serializeLog(log),
      newValue: null,
    });
  }

  private async requireEmployee(userId: string, tenantId: string): Promise<EmployeeWithUser> {
    const employee = await this.attendanceRepository.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException(`Empleado con userId "${userId}" no encontrado`);
    }
    return employee;
  }

  private async assertEmployeeLocationAllowed(
    tenantId: string,
    actor: AttendanceActingUser,
    employeeLocationId: string,
  ): Promise<void> {
    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(tenantId, {
      userId: actor.sub,
      roleCode: actor.roleCode,
    });
    this.userLocationsService.assertLocationAllowed(allowedLocationIds, employeeLocationId);
  }

  private assertDateRange(from: Date, to: Date): void {
    if (!isCardDateRangeWithinLimit(from, to)) {
      throw new BadRequestException('El rango máximo de consulta es de 3 meses');
    }
  }

  private assertTimestampWithinWorkDate(
    workDate: Date,
    timestamp: Date,
    eventType: CreateManualMarkingInput['eventType'],
  ): void {
    const normalizedTimestamp = normalizeWorkDate(timestamp);
    const nextDay = new Date(workDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const isSameDay = normalizedTimestamp.getTime() === workDate.getTime();
    const isNextDay = normalizedTimestamp.getTime() === nextDay.getTime();

    // El EXIT puede caer en el día siguiente para soportar turnos nocturnos
    // que cruzan medianoche (mismo criterio que el ENTRY/EXIT automático — ver
    // el comentario de `workDate` en AttendanceLog, schema.prisma).
    const valid = eventType === 'EXIT' ? isSameDay || isNextDay : isSameDay;
    if (!valid) {
      throw new BadRequestException('El timestamp de la marcación no corresponde a workDate');
    }
  }

  private serializeLog(log: AttendanceLog): Record<string, unknown> {
    return {
      id: log.id,
      eventType: log.eventType,
      timestamp: log.timestamp,
      workDate: log.workDate,
      source: log.source,
    };
  }
}
