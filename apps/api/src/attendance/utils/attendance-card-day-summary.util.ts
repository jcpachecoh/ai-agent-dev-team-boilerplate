import { AttendanceEventType } from '@prisma/client';

import type { ResolvedShift } from '../../turnos/interfaces/employee-shift-assignment.interfaces';
import type {
  AttendanceCardDaySummary,
  AttendanceLogFull,
} from '../interfaces/attendance.interfaces';
import {
  formatCalendarDate,
  formatMinutesAsHours,
  listDatesInRange,
  splitWorkedMinutesAgainstTarget,
} from './attendance-calculation.util';

function computeWorkedMinutes(
  entry: AttendanceLogFull | undefined,
  exit: AttendanceLogFull | undefined,
): number {
  if (!entry) return 0;
  const exitTime = exit?.timestamp ?? entry.timestamp;
  const diffMs = exitTime.getTime() - entry.timestamp.getTime();
  return diffMs > 0 ? Math.floor(diffMs / 60_000) : 0;
}

function mapResolvedShiftLabels(resolved: ResolvedShift): {
  shiftName: string | null;
  shiftRange: string | null;
} {
  if (resolved.kind === 'REST') {
    return { shiftName: 'Descanso', shiftRange: null };
  }
  if (resolved.kind === 'NONE') {
    return { shiftName: null, shiftRange: null };
  }

  const turno = resolved.turno;
  return {
    shiftName: turno.nombre,
    shiftRange: `${turno.horaInicio}-${turno.horaFin}`,
  };
}

export function buildAttendanceCardDaySummaries(params: {
  dateFrom: Date;
  dateTo: Date;
  logs: AttendanceLogFull[];
  vacationDateKeys?: Set<string>;
  absenceLabelsByDate?: Map<string, string>;
  resolveForDay: (workDate: Date) => Promise<ResolvedShift>;
}): Promise<AttendanceCardDaySummary[]> {
  const { dateFrom, dateTo, logs, vacationDateKeys, absenceLabelsByDate, resolveForDay } = params;
  const dates = listDatesInRange(dateFrom, dateTo);

  const logsByDate = new Map<string, { entry?: AttendanceLogFull; exit?: AttendanceLogFull }>();
  for (const log of logs) {
    const key = formatCalendarDate(log.workDate);
    if (!logsByDate.has(key)) {
      logsByDate.set(key, {});
    }
    const group = logsByDate.get(key)!;
    if (log.eventType === AttendanceEventType.ENTRY && !group.entry) {
      group.entry = log;
    } else if (log.eventType === AttendanceEventType.EXIT && !group.exit) {
      group.exit = log;
    }
  }

  return Promise.all(
    dates.map(async (workDate): Promise<AttendanceCardDaySummary> => {
      const workDateKey = formatCalendarDate(workDate);
      const payrollAbsenceLabel = absenceLabelsByDate?.get(workDateKey) ?? null;

      if (vacationDateKeys?.has(workDateKey) && !payrollAbsenceLabel) {
        return {
          workDate: workDateKey,
          targetMinutes: 0,
          targetHours: '—',
          ordinaryMinutes: 0,
          unworkedMinutes: 0,
          overtimeMinutes: 0,
          resolvedKind: 'VACACIONES',
          shiftName: 'Vacaciones',
          shiftRange: null,
          absenceLabel: 'Vacaciones',
        };
      }

      const resolved = await resolveForDay(workDate);
      const targetMinutes = resolved.targetMinutes;
      const dayLogs = logsByDate.get(workDateKey);
      const workedMinutes = computeWorkedMinutes(dayLogs?.entry, dayLogs?.exit);
      const hasAttendance = Boolean(dayLogs?.entry || dayLogs?.exit);
      const { ordinaryMinutes, overtimeMinutes, unworkedMinutes } = splitWorkedMinutesAgainstTarget(
        workedMinutes,
        targetMinutes,
      );
      const labels = mapResolvedShiftLabels(resolved);
      const absenceLabel = payrollAbsenceLabel ?? null;

      return {
        workDate: workDateKey,
        targetMinutes,
        targetHours: targetMinutes > 0 ? formatMinutesAsHours(targetMinutes) : '—',
        ordinaryMinutes: hasAttendance ? ordinaryMinutes : 0,
        unworkedMinutes:
          absenceLabel || targetMinutes === 0
            ? 0
            : targetMinutes > 0 && !hasAttendance
              ? targetMinutes
              : targetMinutes > 0
                ? unworkedMinutes
                : 0,
        overtimeMinutes: hasAttendance ? overtimeMinutes : 0,
        resolvedKind: resolved.kind,
        shiftName: absenceLabel && !hasAttendance ? absenceLabel : labels.shiftName,
        shiftRange: labels.shiftRange,
        absenceLabel: hasAttendance ? null : absenceLabel,
      };
    }),
  );
}
