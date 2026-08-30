import { COLOMBIA_TZ } from '../attendance.constants';

export type AttendancePeriodPreset = 'day' | 'week' | 'month' | 'year';

export interface AttendancePeriodRange {
  period: AttendancePeriodPreset;
  anchorDate: string;
  dateFrom: string;
  dateTo: string;
}

function parseAnchorDate(anchorDate: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(anchorDate);
  if (!match) {
    throw new Error(`Invalid anchorDate: ${anchorDate}`);
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

function getBogotaDateParts(date: Date): { year: number; month: number; day: number } {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [year, month, day] = formatted.split('-').map(Number);
  return { year, month, day };
}

function getTodayAnchorDate(timeZone: string = COLOMBIA_TZ): string {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return formatted;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getMondayBasedWeekRange(
  year: number,
  month: number,
  day: number,
): {
  dateFrom: string;
  dateTo: string;
} {
  const anchor = new Date(Date.UTC(year, month - 1, day));
  const weekday = anchor.getUTCDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    dateFrom: formatDateParts(
      monday.getUTCFullYear(),
      monday.getUTCMonth() + 1,
      monday.getUTCDate(),
    ),
    dateTo: formatDateParts(sunday.getUTCFullYear(), sunday.getUTCMonth() + 1, sunday.getUTCDate()),
  };
}

export function resolveAttendancePeriodRange(
  period: AttendancePeriodPreset,
  anchorDate: string,
  timeZone: string = COLOMBIA_TZ,
): AttendancePeriodRange {
  const { year, month, day } = parseAnchorDate(anchorDate);

  if (period === 'day') {
    return { period, anchorDate, dateFrom: anchorDate, dateTo: anchorDate };
  }

  if (period === 'week') {
    const week = getMondayBasedWeekRange(year, month, day);
    return { period, anchorDate, ...week };
  }

  if (period === 'month') {
    return {
      period,
      anchorDate,
      dateFrom: formatDateParts(year, month, 1),
      dateTo: formatDateParts(year, month, daysInMonth(year, month)),
    };
  }

  return {
    period,
    anchorDate,
    dateFrom: formatDateParts(year, 1, 1),
    dateTo: formatDateParts(year, 12, 31),
  };
}

export function isLiveAttendancePeriod(
  period: AttendancePeriodPreset,
  anchorDate: string,
  timeZone: string = COLOMBIA_TZ,
): boolean {
  return period === 'day' && anchorDate === getTodayAnchorDate(timeZone);
}

export function workDateFromIso(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00.000Z`);
}

export function enumerateWorkDates(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const start = parseAnchorDate(dateFrom);
  const end = parseAnchorDate(dateTo);
  const cursor = new Date(Date.UTC(start.year, start.month - 1, start.day));

  while (true) {
    const current = formatDateParts(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth() + 1,
      cursor.getUTCDate(),
    );
    dates.push(current);
    if (current === dateTo) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (dates.length > 400) break;
  }

  return dates;
}

export { getBogotaDateParts, getTodayAnchorDate };
