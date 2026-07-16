import { AttendanceEventType, AttendanceLog, AttendanceMarkingScope } from '@prisma/client';

import {
  computeShiftEndDateTime,
  computeShiftStartDateTime,
} from '../../overtime/utils/shift-end.util';

export { computeShiftEndDateTime, computeShiftStartDateTime };

export interface OrdinaryTimeResult {
  ordinaryMinutes: number;
  effectiveStart: Date | null;
  effectiveEnd: Date | null;
  clippedEarlyMinutes: number;
  clippedLateMinutes: number;
}

export interface DayMinutesByScopeResult {
  ordinaryMinutes: number;
  overtimeScopeMinutes: number;
}

type AttendanceLogSlice = Pick<
  AttendanceLog,
  'eventType' | 'markingScope' | 'timestamp' | 'isActive'
>;

function floorMinutesBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60_000);
}

/** Calcula minutos ordinarios de un par ENTRY→EXIT recortado a ventana planificada. */
export function computeOrdinaryPairMinutes(params: {
  entryTimestamp: Date;
  exitTimestamp: Date;
  shiftStartTime: Date;
  shiftEndTime: Date;
  cutoffTime?: Date | null;
}): OrdinaryTimeResult {
  const { entryTimestamp, exitTimestamp, shiftStartTime, shiftEndTime, cutoffTime } = params;
  const effectiveEndCapMs = Math.min(
    (cutoffTime ?? shiftEndTime).getTime(),
    shiftEndTime.getTime(),
  );

  const effectiveStartMs = Math.max(entryTimestamp.getTime(), shiftStartTime.getTime());
  const effectiveEndMs = Math.min(exitTimestamp.getTime(), effectiveEndCapMs);

  const clippedEarlyMinutes =
    entryTimestamp.getTime() < shiftStartTime.getTime()
      ? floorMinutesBetween(entryTimestamp, shiftStartTime)
      : 0;

  const clippedLateMinutes =
    exitTimestamp.getTime() > effectiveEndCapMs
      ? floorMinutesBetween(new Date(effectiveEndCapMs), exitTimestamp)
      : 0;

  if (effectiveEndMs <= effectiveStartMs) {
    return {
      ordinaryMinutes: 0,
      effectiveStart: null,
      effectiveEnd: null,
      clippedEarlyMinutes,
      clippedLateMinutes,
    };
  }

  return {
    ordinaryMinutes: floorMinutesBetween(new Date(effectiveStartMs), new Date(effectiveEndMs)),
    effectiveStart: new Date(effectiveStartMs),
    effectiveEnd: new Date(effectiveEndMs),
    clippedEarlyMinutes,
    clippedLateMinutes,
  };
}

function pairLogsByScope(
  logs: AttendanceLogSlice[],
  scope: AttendanceMarkingScope,
): Array<{ entry: Date; exit: Date }> {
  const scoped = logs
    .filter((log) => log.isActive !== false && log.markingScope === scope)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const entries = scoped.filter((log) => log.eventType === AttendanceEventType.ENTRY);
  const exits = scoped.filter((log) => log.eventType === AttendanceEventType.EXIT);

  const pairs: Array<{ entry: Date; exit: Date }> = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const exit = exits[index];
    if (!entry || !exit) continue;
    pairs.push({ entry: entry.timestamp, exit: exit.timestamp });
  }

  return pairs;
}

/** Agrupa logs por markingScope y calcula minutos ordinarios vs tiempo adicional explícito. */
export function computeDayMinutesByScope(params: {
  logs: AttendanceLogSlice[];
  shiftStartTime: Date;
  shiftEndTime: Date;
  cutoffTime?: Date | null;
}): DayMinutesByScopeResult {
  const { logs, shiftStartTime, shiftEndTime, cutoffTime } = params;

  const ordinaryPairs = pairLogsByScope(logs, AttendanceMarkingScope.ORDINARY);
  const overtimePairs = pairLogsByScope(logs, AttendanceMarkingScope.OVERTIME);

  let ordinaryMinutes = 0;
  for (const pair of ordinaryPairs) {
    ordinaryMinutes += computeOrdinaryPairMinutes({
      entryTimestamp: pair.entry,
      exitTimestamp: pair.exit,
      shiftStartTime,
      shiftEndTime,
      cutoffTime,
    }).ordinaryMinutes;
  }

  let overtimeScopeMinutes = 0;
  for (const pair of overtimePairs) {
    overtimeScopeMinutes += floorMinutesBetween(pair.entry, pair.exit);
  }

  return { ordinaryMinutes, overtimeScopeMinutes };
}

/** Resuelve shiftStart/shiftEnd a partir de workDate y horas del turno. */
export function resolveShiftWindow(
  workDate: Date,
  horaInicio: string,
  horaFin: string,
): { shiftStartTime: Date; shiftEndTime: Date } {
  return {
    shiftStartTime: computeShiftStartDateTime(workDate, horaInicio, horaFin),
    shiftEndTime: computeShiftEndDateTime(workDate, horaInicio, horaFin),
  };
}
