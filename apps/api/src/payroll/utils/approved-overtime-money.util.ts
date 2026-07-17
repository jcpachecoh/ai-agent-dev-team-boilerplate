import {
  OvertimeRequestType,
  OvertimeStatus,
  type AttendanceEventType,
  type AttendanceMarkingScope,
  Prisma,
} from '@prisma/client';

import { classifyOvertimeSurcharge } from './overtime-surcharge.util';
import { normalizeWorkDate } from '../../attendance/repository/attendance.repository';
import { getBogotaHour } from '../../attendance/utils/attendance-calculation.util';
import type { LegalParameterSnapshot } from '../../labor-legal-parameters/service/legal-parameter-snapshot';
import type { ApprovedAdministrativeOvertimeWindow } from '../../overtime/interfaces/overtime.interfaces';
import type { TimeInterval } from '../../overtime/utils/liquidable-overtime-intervals.util';
import { decideNom07OvertimeLiquidation } from '../../overtime/utils/nom07-overtime-liquidation.util';
import { payrollPeriodToWorkDateRange } from '../../overtime/utils/overtime-period.util';
import { isColombianHoliday } from '../../reports/service/colombia-holidays.util';
import type { AttendanceOvertimeType } from '../payroll.constants';

const COLOMBIA_TZ = 'America/Bogota';
const DEFAULT_MONTHLY_HOURS_BASE = 240;

export type ApprovedOvertimeRequestSlice = {
  id: string;
  type: OvertimeRequestType;
  payrollPeriod: string | null;
  accumulatedMinutes: number | null;
  shiftEndTime: Date | null;
  actualEndTime: Date | null;
  workDate: Date | null;
  proposedStartTime: Date | null;
  proposedEndTime: Date | null;
  proposedMinutes: number | null;
};

export type AttendanceLogSlice = {
  eventType: AttendanceEventType;
  timestamp: Date;
  isActive?: boolean | null;
  markingScope?: AttendanceMarkingScope | null;
};

export type ApprovedOvertimeMoneyResult = {
  amount: Prisma.Decimal;
  sourceIds: string[];
  concepts: string[];
  liquidableMinutes: number;
  usedLegacyAutomatic: boolean;
};

function bogotaDateKey(ts: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ts);
}

function parseCalendarDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

function groupByPayrollPeriod(
  requests: ApprovedOvertimeRequestSlice[],
): Map<string, ApprovedOvertimeRequestSlice[]> {
  const groups = new Map<string, ApprovedOvertimeRequestSlice[]>();
  for (const request of requests) {
    const key = request.payrollPeriod ?? '__unknown__';
    const bucket = groups.get(key) ?? [];
    bucket.push(request);
    groups.set(key, bucket);
  }
  return groups;
}

function logsForPeriod(
  logs: AttendanceLogSlice[],
  payrollPeriod: string | null,
  fallbackStart: Date,
  fallbackEnd: Date,
): AttendanceLogSlice[] {
  if (!payrollPeriod || payrollPeriod === '__unknown__') {
    return logs.filter(
      (log): boolean => log.timestamp >= fallbackStart && log.timestamp <= fallbackEnd,
    );
  }
  const { workDateFrom, workDateTo } = payrollPeriodToWorkDateRange(payrollPeriod);
  const rangeEnd = new Date(workDateTo);
  rangeEnd.setUTCHours(23, 59, 59, 999);
  return logs.filter((log): boolean => log.timestamp >= workDateFrom && log.timestamp <= rangeEnd);
}

function toAdminWindows(
  requests: ApprovedOvertimeRequestSlice[],
): ApprovedAdministrativeOvertimeWindow[] {
  const windows: ApprovedAdministrativeOvertimeWindow[] = [];
  for (const request of requests) {
    if (request.type !== OvertimeRequestType.SOLICITUD_ADMINISTRATIVA) {
      continue;
    }
    if (!request.proposedStartTime || !request.proposedEndTime) {
      continue;
    }
    windows.push({
      employeeId: '',
      locationId: '',
      workDate: request.workDate,
      proposedStartTime: request.proposedStartTime,
      proposedEndTime: request.proposedEndTime,
      proposedMinutes: request.proposedMinutes,
    });
  }
  return windows;
}

function classifyInterval(
  interval: TimeInterval,
  legalSnapshot: LegalParameterSnapshot,
): { type: AttendanceOvertimeType; surchargeRate: number; date: Date } {
  const start = new Date(interval.startMs);
  const end = new Date(interval.endMs);
  const dateKey = bogotaDateKey(start);
  const date = parseCalendarDateKey(dateKey);
  const nocturnoStartHour = legalSnapshot.numberAt('HORARIO_NOCTURNO_INICIO', date);
  const isNocturno =
    getBogotaHour(start) >= nocturnoStartHour || getBogotaHour(end) >= nocturnoStartHour;
  const isFestivo = isColombianHoliday(dateKey);
  const { type, surchargeRate } = classifyOvertimeSurcharge(isNocturno, isFestivo, {
    recargoHoraExtraDiurna: legalSnapshot.numberAt('RECARGO_HORA_EXTRA_DIURNA', date),
    recargoHoraExtraNocturna: legalSnapshot.numberAt('RECARGO_HORA_EXTRA_NOCTURNA', date),
    recargoDominicalFestivo: legalSnapshot.numberAt('RECARGO_DOMINICAL_FESTIVO', date),
  });
  return { type, surchargeRate, date };
}

function moneyForMinutes(
  minutes: number,
  surchargeRate: number,
  monthlySalary: Prisma.Decimal,
  monthlyHoursBase: number,
): Prisma.Decimal {
  if (minutes <= 0) {
    return new Prisma.Decimal(0);
  }
  const hours = minutes / 60;
  const hourlyRate = monthlySalary.dividedBy(monthlyHoursBase);
  return hourlyRate.times(new Prisma.Decimal(1).plus(surchargeRate)).times(hours);
}

/**
 * OS-606 Task-09 — valoriza overtime APROBADA reutilizando NOM-07 (Task-08).
 *
 * - `OvertimeRequest.type` es origen, NUNCA tarifa.
 * - Admin sin marcación liquidable → 0.
 * - Auto + admin → unión de intervalos (sin doble conteo).
 * - Legacy CONN-04a: auto APROBADA sin pares OVERTIME → accumulatedMinutes clasificados por horario.
 */
export function computeApprovedOvertimeMoney(params: {
  requests: ApprovedOvertimeRequestSlice[];
  logs: AttendanceLogSlice[];
  resolveSalaryAt: (date: Date) => Prisma.Decimal | null;
  legalSnapshot: LegalParameterSnapshot;
  rangeStart: Date;
  rangeEnd: Date;
  monthlyHoursBase?: number;
}): ApprovedOvertimeMoneyResult {
  const monthlyHoursBase = params.monthlyHoursBase ?? DEFAULT_MONTHLY_HOURS_BASE;
  let amount = new Prisma.Decimal(0);
  const sourceIds: string[] = [];
  const concepts = new Set<string>();
  let liquidableMinutes = 0;
  let usedLegacyAutomatic = false;

  const groups = groupByPayrollPeriod(params.requests);

  for (const [periodKey, periodRequests] of groups) {
    const autoRequests = periodRequests.filter(
      (request): boolean => request.type === OvertimeRequestType.DETECCION_AUTOMATICA,
    );
    const adminRequests = periodRequests.filter(
      (request): boolean => request.type === OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
    );
    const periodLogs = logsForPeriod(
      params.logs,
      periodKey === '__unknown__' ? null : periodKey,
      params.rangeStart,
      params.rangeEnd,
    );

    const decision = decideNom07OvertimeLiquidation({
      logs: periodLogs.map(
        (
          log,
        ): {
          eventType: AttendanceEventType;
          timestamp: Date;
          isActive: boolean;
          markingScope?: AttendanceMarkingScope | null;
        } => ({
          eventType: log.eventType,
          timestamp: log.timestamp,
          isActive: log.isActive ?? true,
          markingScope: log.markingScope,
        }),
      ),
      automaticStatus: autoRequests.length > 0 ? OvertimeStatus.APROBADA : null,
      approvedAdminWindows: toAdminWindows(adminRequests),
    });

    if (decision.useLegacyAutomaticSummary) {
      usedLegacyAutomatic = true;
      for (const auto of autoRequests) {
        if (
          auto.accumulatedMinutes === null ||
          auto.shiftEndTime === null ||
          auto.actualEndTime === null
        ) {
          continue;
        }
        const requestDate = normalizeWorkDate(auto.shiftEndTime);
        const salary = params.resolveSalaryAt(requestDate);
        if (!salary) {
          continue;
        }
        const nocturnoStartHour = params.legalSnapshot.numberAt(
          'HORARIO_NOCTURNO_INICIO',
          requestDate,
        );
        const isNocturno =
          getBogotaHour(auto.shiftEndTime) >= nocturnoStartHour ||
          getBogotaHour(auto.actualEndTime) >= nocturnoStartHour;
        const isFestivo = isColombianHoliday(requestDate);
        const { type, surchargeRate } = classifyOvertimeSurcharge(isNocturno, isFestivo, {
          recargoHoraExtraDiurna: params.legalSnapshot.numberAt(
            'RECARGO_HORA_EXTRA_DIURNA',
            requestDate,
          ),
          recargoHoraExtraNocturna: params.legalSnapshot.numberAt(
            'RECARGO_HORA_EXTRA_NOCTURNA',
            requestDate,
          ),
          recargoDominicalFestivo: params.legalSnapshot.numberAt(
            'RECARGO_DOMINICAL_FESTIVO',
            requestDate,
          ),
        });
        const part = moneyForMinutes(
          auto.accumulatedMinutes,
          surchargeRate,
          salary,
          monthlyHoursBase,
        );
        if (part.greaterThan(0)) {
          amount = amount.plus(part);
          liquidableMinutes += auto.accumulatedMinutes;
          sourceIds.push(auto.id);
          concepts.add(`OVERTIME:${type}`);
        }
      }
      continue;
    }

    if (decision.zeroOvertime) {
      continue;
    }

    for (const interval of decision.computation.liquidable) {
      const minutes = Math.floor((interval.endMs - interval.startMs) / 60_000);
      if (minutes <= 0) {
        continue;
      }
      const { type, surchargeRate, date } = classifyInterval(interval, params.legalSnapshot);
      const salary = params.resolveSalaryAt(date);
      if (!salary) {
        continue;
      }
      const part = moneyForMinutes(minutes, surchargeRate, salary, monthlyHoursBase);
      if (part.greaterThan(0)) {
        amount = amount.plus(part);
        liquidableMinutes += minutes;
        concepts.add(`OVERTIME:${type}`);
      }
    }

    for (const request of periodRequests) {
      sourceIds.push(request.id);
    }
  }

  return {
    amount,
    sourceIds: [...new Set(sourceIds)],
    concepts: [...concepts],
    liquidableMinutes,
    usedLegacyAutomatic,
  };
}
