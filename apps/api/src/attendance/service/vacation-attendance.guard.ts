import { ConflictException } from '@nestjs/common';

import type {
  ApprovedVacationRange,
  IVacationsService,
} from '../../vacations/interfaces/vacations.interfaces';
import { formatCalendarDate } from '../utils/attendance-calculation.util';

/** VACACIONES ≠ AUSENTE: bloqueo D6 y exclusión PC-1 solo aplican a DISFRUTE APROBADA. */
export const VACATION_MARKING_BLOCKED_MESSAGE =
  'No puede marcar asistencia: tiene vacaciones aprobadas en esta fecha.';

export async function assertNotOnApprovedVacation(
  vacationsService: IVacationsService | undefined,
  tenantId: string,
  employeeId: string,
  workDate: Date,
): Promise<void> {
  if (!vacationsService) {
    return;
  }

  const vacation = await vacationsService.findApprovedDisfruteByDate(
    tenantId,
    employeeId,
    workDate,
  );
  if (vacation) {
    throw new ConflictException(VACATION_MARKING_BLOCKED_MESSAGE);
  }
}

export async function hasApprovedVacationInRange(
  vacationsService: IVacationsService | undefined,
  tenantId: string,
  employeeId: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<boolean> {
  if (!vacationsService) {
    return false;
  }

  const ranges = await vacationsService.getApprovedDisfruteRanges(
    tenantId,
    employeeId,
    dateFrom,
    dateTo,
  );
  return ranges.length > 0;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isDateWithinApprovedVacation(ranges: ApprovedVacationRange[], date: Date): boolean {
  const dayMs = startOfUtcDay(date).getTime();
  return ranges.some((range) => {
    const startMs = startOfUtcDay(range.startDate).getTime();
    const endMs = startOfUtcDay(range.endDate).getTime();
    return dayMs >= startMs && dayMs <= endMs;
  });
}

export function countApprovedVacationDaysInRange(
  ranges: ApprovedVacationRange[],
  dateFrom: Date,
  dateTo: Date,
): number {
  let count = 0;
  const cursor = startOfUtcDay(dateFrom);
  const end = startOfUtcDay(dateTo);

  while (cursor.getTime() <= end.getTime()) {
    if (isDateWithinApprovedVacation(ranges, cursor)) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

export function buildVacationDateKeySet(
  ranges: ApprovedVacationRange[],
  dateFrom: Date,
  dateTo: Date,
): Set<string> {
  const keys = new Set<string>();
  const cursor = startOfUtcDay(dateFrom);
  const end = startOfUtcDay(dateTo);

  while (cursor.getTime() <= end.getTime()) {
    if (isDateWithinApprovedVacation(ranges, cursor)) {
      keys.add(formatCalendarDate(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}
