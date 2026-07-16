import { Injectable, Logger } from '@nestjs/common';
import {
  AttendanceEventType,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
} from '@prisma/client';

import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import {
  OVERTIME_ACCUMULATION_THRESHOLD_MINUTES,
  type ExitRegisteredPayload,
  type IOvertimeDetectionService,
} from '../interfaces/overtime.interfaces';
import { OvertimeRepository } from '../repository/overtime.repository';
import { formatPayrollPeriod, payrollPeriodToWorkDateRange } from '../utils/overtime-period.util';
import { computeShiftEndDateTime } from '../utils/shift-end.util';
import { OvertimeNotificationService } from './overtime-notification.service';

interface OvertimeScopePair {
  workDate: Date;
  entryTimestamp: Date;
  exitTimestamp: Date;
}

@Injectable()
export class OvertimeDetectionService implements IOvertimeDetectionService {
  private readonly logger = new Logger(OvertimeDetectionService.name);

  constructor(
    private readonly repository: OvertimeRepository,
    private readonly shiftResolutionService: ShiftResolutionService,
    private readonly notificationService: OvertimeNotificationService,
  ) {}

  async onExitRegistered(payload: ExitRegisteredPayload): Promise<void> {
    const payrollPeriod = formatPayrollPeriod(payload.workDate);
    const existing = await this.repository.findActiveAutomaticByPeriod(
      payload.tenantId,
      payload.employeeId,
      payload.locationId,
      payrollPeriod,
    );

    if (existing?.status === OvertimeStatus.OBJETADA) {
      this.logger.debug(
        `Skip overtime detection — OBJETADA request exists for employee=${payload.employeeId} period=${payrollPeriod}`,
      );
      return;
    }

    if (existing?.status === OvertimeStatus.APROBADA) {
      this.logger.debug(
        `Skip overtime detection — APROBADA request exists for employee=${payload.employeeId} period=${payrollPeriod}`,
      );
      return;
    }

    const accumulated = await this.recalculatePeriodOvertimeMinutes(payload, payrollPeriod);
    if (accumulated.totalMinutes <= OVERTIME_ACCUMULATION_THRESHOLD_MINUTES) {
      return;
    }

    const latestShiftEnd = accumulated.latestShiftEnd ?? payload.actualEndTime;
    const latestActualEnd = accumulated.latestActualEnd ?? payload.actualEndTime;

    if (!existing) {
      const created = await this.repository.createRequest(payload.tenantId, {
        employeeId: payload.employeeId,
        locationId: payload.locationId,
        type: OvertimeRequestType.DETECCION_AUTOMATICA,
        shiftEndTime: latestShiftEnd,
        actualEndTime: latestActualEnd,
        accumulatedMinutes: accumulated.totalMinutes,
        status: OvertimeStatus.PENDIENTE_ADMIN,
        payrollPeriod,
      });

      await this.ensurePendingApprovalRows(payload.tenantId, created.id);
      await this.notificationService
        .notifyLevelPending(payload.tenantId, created.id, OvertimeStatus.PENDIENTE_ADMIN)
        .catch((err: unknown) => {
          this.logger.warn(`Overtime notification failed: ${String(err)}`);
        });
      return;
    }

    if (OVERTIME_PENDING_STATUSES.includes(existing.status)) {
      await this.repository.updateRequest(payload.tenantId, existing.id, {
        accumulatedMinutes: accumulated.totalMinutes,
        actualEndTime: latestActualEnd,
        shiftEndTime: latestShiftEnd,
      });
    }
  }

  private async recalculatePeriodOvertimeMinutes(
    payload: ExitRegisteredPayload,
    payrollPeriod: string,
  ): Promise<{
    totalMinutes: number;
    latestShiftEnd: Date | null;
    latestActualEnd: Date | null;
  }> {
    const { workDateFrom, workDateTo } = payrollPeriodToWorkDateRange(payrollPeriod);
    const logs = await this.repository.findOvertimeScopeLogsForPeriod(
      payload.tenantId,
      payload.employeeId,
      payload.locationId,
      workDateFrom,
      workDateTo,
    );

    const pairs = pairOvertimeScopeLogs(logs);
    let totalMinutes = 0;
    let latestShiftEnd: Date | null = null;
    let latestActualEnd: Date | null = null;

    for (const pair of pairs) {
      const durationMinutes = floorMinutesBetween(pair.entryTimestamp, pair.exitTimestamp);
      if (durationMinutes <= 0) continue;

      totalMinutes += durationMinutes;

      if (!latestActualEnd || pair.exitTimestamp > latestActualEnd) {
        latestActualEnd = pair.exitTimestamp;
        latestShiftEnd = await this.resolveShiftEndForWorkDate(payload, pair.workDate);
      }
    }

    return { totalMinutes, latestShiftEnd, latestActualEnd };
  }

  private async resolveShiftEndForWorkDate(
    payload: ExitRegisteredPayload,
    workDate: Date,
  ): Promise<Date> {
    const resolved = await this.shiftResolutionService.resolveForDay({
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      workDate,
    });

    if (resolved.kind === 'ASSIGNED') {
      return computeShiftEndDateTime(workDate, resolved.turno.horaInicio, resolved.turno.horaFin);
    }

    return workDate;
  }

  private async ensurePendingApprovalRows(
    tenantId: string,
    overtimeRequestId: string,
  ): Promise<void> {
    const levels: OvertimeApprovalLevel[] = [
      OvertimeApprovalLevel.ADMINISTRADOR,
      OvertimeApprovalLevel.GERENCIA_OPERACIONES,
      OvertimeApprovalLevel.GERENCIA_GENERAL,
    ];

    for (const level of levels) {
      await this.repository.upsertApproval(tenantId, overtimeRequestId, level, {
        decision: null,
        approverId: null,
        decidedAt: null,
        comment: null,
      });
    }
  }
}

function pairOvertimeScopeLogs(
  logs: Array<{ workDate: Date; eventType: AttendanceEventType; timestamp: Date }>,
): OvertimeScopePair[] {
  const byWorkDate = new Map<string, typeof logs>();

  for (const log of logs) {
    const key = log.workDate.toISOString();
    const bucket = byWorkDate.get(key) ?? [];
    bucket.push(log);
    byWorkDate.set(key, bucket);
  }

  const pairs: OvertimeScopePair[] = [];

  for (const dayLogs of byWorkDate.values()) {
    const sorted = [...dayLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const entries = sorted.filter((log) => log.eventType === AttendanceEventType.ENTRY);
    const exits = sorted.filter((log) => log.eventType === AttendanceEventType.EXIT);

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const exit = exits[index];
      if (!entry || !exit) continue;
      pairs.push({
        workDate: entry.workDate,
        entryTimestamp: entry.timestamp,
        exitTimestamp: exit.timestamp,
      });
    }
  }

  return pairs;
}

function floorMinutesBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60_000);
}

const OVERTIME_PENDING_STATUSES: readonly OvertimeStatus[] = [
  OvertimeStatus.PENDIENTE_ADMIN,
  OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
  OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
];
