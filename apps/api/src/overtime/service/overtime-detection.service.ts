import { Injectable, Logger } from '@nestjs/common';
import { OvertimeApprovalLevel, OvertimeRequestType, OvertimeStatus } from '@prisma/client';

import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import {
  OVERTIME_ACCUMULATION_THRESHOLD_MINUTES,
  type ExitRegisteredPayload,
  type IOvertimeDetectionService,
} from '../interfaces/overtime.interfaces';
import { OvertimeRepository } from '../repository/overtime.repository';
import { formatPayrollPeriod, payrollPeriodToWorkDateRange } from '../utils/overtime-period.util';
import { computeExcessMinutes, computeShiftEndDateTime } from '../utils/shift-end.util';
import { OvertimeNotificationService } from './overtime-notification.service';

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

    const accumulated = await this.recalculatePeriodExcess(payload, payrollPeriod);
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

  private async recalculatePeriodExcess(
    payload: ExitRegisteredPayload,
    payrollPeriod: string,
  ): Promise<{
    totalMinutes: number;
    latestShiftEnd: Date | null;
    latestActualEnd: Date | null;
  }> {
    const { workDateFrom, workDateTo } = payrollPeriodToWorkDateRange(payrollPeriod);
    const exitLogs = await this.repository.findExitLogsForPeriod(
      payload.tenantId,
      payload.employeeId,
      payload.locationId,
      workDateFrom,
      workDateTo,
    );

    let totalMinutes = 0;
    let latestShiftEnd: Date | null = null;
    let latestActualEnd: Date | null = null;

    for (const log of exitLogs) {
      const resolved = await this.shiftResolutionService.resolveForDay({
        tenantId: payload.tenantId,
        employeeId: payload.employeeId,
        locationId: payload.locationId,
        workDate: log.workDate,
      });

      if (resolved.kind !== 'ASSIGNED') continue;

      const shiftEnd = computeShiftEndDateTime(
        log.workDate,
        resolved.turno.horaInicio,
        resolved.turno.horaFin,
      );
      const excess = computeExcessMinutes(log.timestamp, shiftEnd);
      if (excess <= 0) continue;

      totalMinutes += excess;
      latestShiftEnd = shiftEnd;
      latestActualEnd = log.timestamp;
    }

    return { totalMinutes, latestShiftEnd, latestActualEnd };
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

const OVERTIME_PENDING_STATUSES: readonly OvertimeStatus[] = [
  OvertimeStatus.PENDIENTE_ADMIN,
  OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
  OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
];
