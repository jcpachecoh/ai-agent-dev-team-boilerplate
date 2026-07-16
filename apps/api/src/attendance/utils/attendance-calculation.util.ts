import {
  AttendanceEventType,
  AttendanceLog,
  AttendanceMarkingScope,
  AttendanceShift,
} from '@prisma/client';
import {
  ATTENDANCE_CARD_MAX_RANGE_MONTHS,
  COLOMBIA_TZ,
  LATE_ARRIVAL_TOLERANCE_MINUTES,
  REGULAR_DAY_MINUTES,
  SHIFT_AFTERNOON_START,
  SHIFT_MORNING_START,
} from '../attendance.constants';
import type { WorkPair } from '../interfaces/attendance.interfaces';
import { computeDayMinutesByScope } from './shift-window.util';

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

/**
 * Resumen operativo crudo ENTRY→EXIT (sin ventana planificada ni markingScope).
 *
 * @deprecated Para tiempo pagable (tarjeta, nómina, API overtime) usar
 * {@link calculatePayableDayMinutes} con turno resuelto (CONN-11).
 * Mantener este helper para monitor operativo, pares abiertos e indicador nocturno.
 */
export function calculateDaySummary(
  logs: AttendanceLog[],
  now: Date,
  /** HORARIO_NOCTURNO_INICIO resolved by the caller — see LaborLegalParametersService (OS-585). */
  nocturnoStartHour: number,
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
      if (entryHour >= nocturnoStartHour || exitHour >= nocturnoStartHour) {
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

/** Minutos de pares con markingScope OVERTIME (brutos del par; aprobación es CONN-04a). */
export function sumOvertimeScopeMinutes(logs: AttendanceLog[]): number {
  if (logs.length === 0) return 0;
  const anchor = logs[0].timestamp;
  return computeDayMinutesByScope({
    logs,
    shiftStartTime: anchor,
    shiftEndTime: anchor,
  }).overtimeScopeMinutes;
}

export interface PayableDayMinutesInput {
  logs: AttendanceLog[];
  shiftStartTime: Date;
  shiftEndTime: Date;
  cutoffTime?: Date | null;
}

/** Minutos ordinarios (ventana planificada) y overtime explícito (CONN-11). */
export function calculatePayableDayMinutes(input: PayableDayMinutesInput): {
  ordinaryMinutes: number;
  overtimeMinutes: number;
} {
  const scoped = computeDayMinutesByScope(input);
  return {
    ordinaryMinutes: scoped.ordinaryMinutes,
    overtimeMinutes: scoped.overtimeScopeMinutes,
  };
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

export function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function listDatesInRange(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function formatMinutesAsHours(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

export function splitWorkedMinutesAgainstTarget(
  workedMinutes: number,
  targetMinutes: number,
): { ordinaryMinutes: number; overtimeMinutes: number; unworkedMinutes: number } {
  const ordinaryMinutes = Math.min(workedMinutes, targetMinutes);
  const overtimeMinutes = Math.max(0, workedMinutes - targetMinutes);
  const unworkedMinutes = Math.max(0, targetMinutes - workedMinutes);
  return { ordinaryMinutes, overtimeMinutes, unworkedMinutes };
}

export function getBogotaMinutesFromMidnight(ts: Date): number {
  return getBogotaHour(ts) * 60 + getBogotaMinute(ts);
}

export function isTimestampWithinShiftWindow(
  timestamp: Date,
  horaInicio: string,
  horaFin: string,
  toleranceMinutes: number,
): boolean {
  const [startH, startM] = horaInicio.split(':').map(Number);
  const [endH, endM] = horaFin.split(':').map(Number);
  const start = startH * 60 + startM - toleranceMinutes;
  let end = endH * 60 + endM + toleranceMinutes;
  const timeMinutes = getBogotaMinutesFromMidnight(timestamp);

  if (endH * 60 + endM < startH * 60 + startM) {
    return timeMinutes >= start || timeMinutes <= end;
  }

  if (end >= 24 * 60) {
    end = 24 * 60 - 1;
  }
  return timeMinutes >= Math.max(0, start) && timeMinutes <= end;
}
