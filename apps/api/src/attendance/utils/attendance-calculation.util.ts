import { AttendanceEventType, AttendanceLog, AttendanceShift } from '@prisma/client';
import {
  ATTENDANCE_CARD_MAX_RANGE_MONTHS,
  COLOMBIA_TZ,
  LATE_ARRIVAL_TOLERANCE_MINUTES,
  NOCTURNO_START_HOUR,
  REGULAR_DAY_MINUTES,
  SHIFT_AFTERNOON_START,
  SHIFT_MORNING_START,
} from '../attendance.constants';
import type { WorkPair } from '../interfaces/attendance.interfaces';

export function getBogotaHour(ts: Date): number {
  const str = new Intl.DateTimeFormat('en', {
    timeZone: COLOMBIA_TZ,
    hour: 'numeric',
    hour12: false,
    hourCycle: 'h23',
  }).format(ts);
  const h = parseInt(str, 10);
  return Number.isNaN(h) ? 0 : h;
}

export function getBogotaMinute(ts: Date): number {
  const str = new Intl.DateTimeFormat('en', {
    timeZone: COLOMBIA_TZ,
    minute: 'numeric',
    hour12: false,
  }).format(ts);
  const m = parseInt(str, 10);
  return Number.isNaN(m) ? 0 : m;
}

export function getShiftStartHour(shift: AttendanceShift | null | undefined): number {
  switch (shift) {
    case AttendanceShift.MORNING:
      return SHIFT_MORNING_START;
    case AttendanceShift.AFTERNOON:
      return SHIFT_AFTERNOON_START;
    case AttendanceShift.NIGHT:
      return 22;
    default:
      return SHIFT_MORNING_START;
  }
}

export function isLateEntry(log: AttendanceLog): boolean {
  if (log.eventType !== AttendanceEventType.ENTRY) return false;
  const entryMinutes = getBogotaHour(log.timestamp) * 60 + getBogotaMinute(log.timestamp);
  const shiftStartMinutes = getShiftStartHour(log.shift) * 60 + LATE_ARRIVAL_TOLERANCE_MINUTES;
  return entryMinutes > shiftStartMinutes;
}

export function calculateDaySummary(
  logs: AttendanceLog[],
  now: Date,
): { totalMinutes: number; overtimeMinutes: number; isNocturno: boolean; pairs: WorkPair[] } {
  const entries = logs.filter((log) => log.eventType === AttendanceEventType.ENTRY);
  const exits = logs.filter((log) => log.eventType === AttendanceEventType.EXIT);

  const pairs: WorkPair[] = [];
  let totalMs = 0;
  let isNocturno = false;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const exit = exits[index] ?? null;
    const exitTime = exit?.timestamp ?? now;
    const durationMs = exitTime.getTime() - entry.timestamp.getTime();
    totalMs += durationMs;

    if (!isNocturno) {
      const entryHour = getBogotaHour(entry.timestamp);
      const exitHour = getBogotaHour(exitTime);
      if (entryHour >= NOCTURNO_START_HOUR || exitHour >= NOCTURNO_START_HOUR) {
        isNocturno = true;
      }
    }

    pairs.push({
      entryId: entry.id,
      exitId: exit?.id,
      entryTimestamp: entry.timestamp,
      exitTimestamp: exit?.timestamp,
      durationMinutes: Math.max(0, Math.floor(durationMs / 60_000)),
    });
  }

  const totalMinutes = Math.floor(totalMs / 60_000);
  const overtimeMinutes = Math.max(0, totalMinutes - REGULAR_DAY_MINUTES);

  return { totalMinutes, overtimeMinutes, isNocturno, pairs };
}

/**
 * OS-551 — espeja `validateAttendanceDateRange` del frontend (attendance-card-dates.ts)
 * para que el límite de 3 meses de la Tarjeta de Asistencia también se exija en el servidor.
 */
export function isCardDateRangeWithinLimit(dateFrom: Date, dateTo: Date): boolean {
  if (dateFrom > dateTo) return false;
  const maxTo = new Date(dateFrom);
  maxTo.setMonth(maxTo.getMonth() + ATTENDANCE_CARD_MAX_RANGE_MONTHS);
  return dateTo <= maxTo;
}

/**
 * Parsea una fecha de calendario ("YYYY-MM-DD") tal cual, sin reinterpretarla
 * por zona horaria. A diferencia de `normalizeWorkDate` (que convierte un
 * INSTANTE real a su día calendario en Bogotá), esto es para valores que ya
 * son un día calendario (dateFrom/dateTo/workDate de la Tarjeta de Asistencia).
 */
export function parseCalendarDate(isoDate: string): Date {
  const datePart = isoDate.slice(0, 10);
  return new Date(`${datePart}T00:00:00.000Z`);
}
