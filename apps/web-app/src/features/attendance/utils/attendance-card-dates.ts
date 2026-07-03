import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
} from 'date-fns';

export const ATTENDANCE_CARD_MAX_RANGE_MONTHS = 3;
export const ATTENDANCE_CARD_PAGE_SIZE = 31;

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getCurrentMonthRange(): { from: Date; to: Date } {
  const today = new Date();
  return {
    from: startOfMonth(today),
    to: endOfMonth(today),
  };
}

export function parseIsoDate(value: string): Date {
  return parseISO(value);
}

export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), 'dd/MM/yyyy');
}

export function validateAttendanceDateRange(from: Date, to: Date): string | null {
  if (isAfter(from, to)) {
    return 'La fecha Desde no puede ser posterior a la fecha Hasta.';
  }

  const maxTo = addMonths(from, ATTENDANCE_CARD_MAX_RANGE_MONTHS);
  if (isAfter(to, maxTo)) {
    return `El rango máximo de consulta es de ${ATTENDANCE_CARD_MAX_RANGE_MONTHS} meses.`;
  }

  return null;
}

export function listIsoDatesInRange(fromIso: string, toIso: string): string[] {
  const from = parseISO(fromIso);
  const to = parseISO(toIso);
  if (isAfter(from, to)) return [];

  return eachDayOfInterval({ start: from, end: to }).map((day) => toIsoDate(day));
}

export function countDaysInclusive(fromIso: string, toIso: string): number {
  return differenceInCalendarDays(parseISO(toIso), parseISO(fromIso)) + 1;
}

export function isWeekend(isoDate: string): boolean {
  const day = parseISO(isoDate).getDay();
  return day === 0 || day === 6;
}

/** Colombian public holidays used for visual highlighting (extend as needed). */
const COLOMBIAN_HOLIDAYS_2026 = new Set([
  '2026-01-01',
  '2026-01-12',
  '2026-03-23',
  '2026-04-02',
  '2026-04-03',
  '2026-05-01',
  '2026-05-18',
  '2026-06-15',
  '2026-06-29',
  '2026-07-20',
  '2026-08-07',
  '2026-08-17',
  '2026-10-12',
  '2026-11-02',
  '2026-11-16',
  '2026-12-08',
  '2026-12-25',
]);

export function isColombianHoliday(isoDate: string): boolean {
  return COLOMBIAN_HOLIDAYS_2026.has(isoDate);
}

export function isRestOrFestiveDay(isoDate: string): boolean {
  return isWeekend(isoDate) || isColombianHoliday(isoDate);
}

export function clampRangeToMonth(from: Date, to: Date): { from: Date; to: Date } {
  if (isBefore(to, from)) {
    return { from, to: from };
  }
  return { from, to };
}
