import { AttendanceEventType, AttendanceMarkingScope } from '@prisma/client';

import type { ResolvedShift } from '../../turnos/interfaces/employee-shift-assignment.interfaces';
import type {
  AttendanceCardDaySummary,
  AttendanceLogFull,
} from '../interfaces/attendance.interfaces';
import {
  calculatePayableDayMinutes,
  formatCalendarDate,
  formatMinutesAsHours,
  listDatesInRange,
  sumOvertimeScopeMinutes,
} from './attendance-calculation.util';
import { resolveShiftWindow } from './shift-window.util';

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

function computeLegacyWorkedMinutes(
  entry: AttendanceLogFull | undefined,
  exit: AttendanceLogFull | undefined,
): number {
  if (!entry) return 0;
  const exitTime = exit?.timestamp ?? entry.timestamp;
  const diffMs = exitTime.getTime() - entry.timestamp.getTime();
  return diffMs > 0 ? Math.floor(diffMs / 60_000) : 0;
}

function resolveDayPayableMinutes(params: {
  dayLogs: AttendanceLogFull[];
  resolved: ResolvedShift;
  cutoffTime?: Date | null;
}): { ordinaryMinutes: number; overtimeMinutes: number } {
  const { dayLogs, resolved, cutoffTime } = params;

  if (resolved.kind === 'ASSIGNED') {
    const { shiftStartTime, shiftEndTime } = resolveShiftWindow(
      dayLogs[0]?.workDate ?? new Date(),
      resolved.turno.horaInicio,
      resolved.turno.horaFin,
    );
    return calculatePayableDayMinutes({
      logs: dayLogs,
      shiftStartTime,
      shiftEndTime,
      cutoffTime,
    });
  }

  const ordinaryLogs = dayLogs.filter(
    (log) =>
      (log.markingScope ?? AttendanceMarkingScope.ORDINARY) === AttendanceMarkingScope.ORDINARY,
  );
  const firstEntry = ordinaryLogs.find((log) => log.eventType === AttendanceEventType.ENTRY);
  const firstExit = [...ordinaryLogs]
    .reverse()
    .find((log) => log.eventType === AttendanceEventType.EXIT);
  const workedMinutes = computeLegacyWorkedMinutes(firstEntry, firstExit);

  return {
    ordinaryMinutes: Math.min(workedMinutes, resolved.targetMinutes),
    overtimeMinutes: sumOvertimeScopeMinutes(dayLogs),
  };
}

export function buildAttendanceCardDaySummaries(params: {
  dateFrom: Date;
  dateTo: Date;
  logs: AttendanceLogFull[];
  vacationDateKeys?: Set<string>;
  absenceLabelsByDate?: Map<string, string>;
  resolveForDay: (workDate: Date) => Promise<ResolvedShift>;
  getCutoffTime?: (workDate: Date) => Promise<Date | null>;
}): Promise<AttendanceCardDaySummary[]> {
  const {
    dateFrom,
    dateTo,
    logs,
    vacationDateKeys,
    absenceLabelsByDate,
    resolveForDay,
    getCutoffTime,
  } = params;
  const dates = listDatesInRange(dateFrom, dateTo);

  const logsByDate = new Map<string, AttendanceLogFull[]>();
  for (const log of logs) {
    const key = formatCalendarDate(log.workDate);
    const bucket = logsByDate.get(key) ?? [];
    bucket.push(log);
    logsByDate.set(key, bucket);
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
      const dayLogs = logsByDate.get(workDateKey) ?? [];
      const hasAttendance = dayLogs.length > 0;
      const cutoffTime = getCutoffTime ? await getCutoffTime(workDate) : null;
      const { ordinaryMinutes, overtimeMinutes } = hasAttendance
        ? resolveDayPayableMinutes({ dayLogs, resolved, cutoffTime })
        : { ordinaryMinutes: 0, overtimeMinutes: 0 };
      const unworkedMinutes =
        targetMinutes > 0 && hasAttendance
          ? Math.max(0, targetMinutes - ordinaryMinutes)
          : targetMinutes;
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
              : unworkedMinutes,
        overtimeMinutes: hasAttendance ? overtimeMinutes : 0,
        resolvedKind: resolved.kind,
        shiftName: absenceLabel && !hasAttendance ? absenceLabel : labels.shiftName,
        shiftRange: labels.shiftRange,
        absenceLabel: hasAttendance ? null : absenceLabel,
      };
    }),
  );
}
