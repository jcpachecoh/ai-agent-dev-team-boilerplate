import { COLOMBIA_TZ } from '../../attendance/attendance.constants';

export const VACATION_MIN_ADVANCE_DAYS = 15;

function parseDateOnly(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatDateParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getBogotaTodayDateString(referenceDate: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate);
}

export function addCalendarDays(dateOnly: string, days: number): string {
  const { year, month, day } = parseDateOnly(dateOnly);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return formatDateParts(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate());
}

export function getEarliestVacationStartDateString(referenceDate: Date = new Date()): string {
  return addCalendarDays(getBogotaTodayDateString(referenceDate), VACATION_MIN_ADVANCE_DAYS);
}

export function dateToDateOnlyString(date: Date): string {
  return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function isVacationStartDateAllowed(
  startDate: Date,
  referenceDate: Date = new Date(),
): boolean {
  const startDateOnly = dateToDateOnlyString(startDate);
  const earliestStart = getEarliestVacationStartDateString(referenceDate);
  return startDateOnly >= earliestStart;
}

/**
 * Cuenta lunes–viernes inclusivos entre startDate y endDate (fechas civiles UTC).
 * No excluye festivos colombianos (MVP).
 */
export function calculateBusinessDaysInRange(startDate: Date, endDate: Date): number {
  const start = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()),
  );

  if (start > end) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}
