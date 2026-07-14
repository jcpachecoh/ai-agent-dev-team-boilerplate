import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import type {
  AsistenciaTarjetaDayRow,
  AsistenciaTarjetaHeaderData,
  AsistenciaTarjetaMetricData,
  AsistenciaTarjetaRowVariant,
  AsistenciaTarjetaSortDirection,
  AsistenciaTarjetaSortKey,
} from '@restopsiq/ui';

import type { PayrollEmployee } from '@/features/payroll/types/payroll.types';

import type {
  AttendanceHistoryItem,
  AttendanceObservationDto,
  AttendanceCardDaySummary,
} from '../types/attendance.types';
import {
  formatMinutesAsHours,
  formatTimeLabel,
  splitWorkedMinutes,
} from '../utils/attendance-card-calculations';
import {
  isColombianHoliday,
  isRestOrFestiveDay,
  isWeekend,
  listIsoDatesInRange,
} from '../utils/attendance-card-dates';

const CONTRACT_LABELS: Record<string, string> = {
  FIJO: 'Término fijo',
  INDEFINIDO: 'Indefinido',
  OBRA: 'Obra o labor',
  PRESTACION: 'Prestación de servicios',
  APRENDIZAJE: 'Aprendizaje',
};

const REGULAR_DAY_MINUTES = 480;

function summaryTargetMinutes(
  summary: AttendanceCardDaySummary | undefined,
  isWorkday: boolean,
): number {
  if (summary) return summary.targetMinutes;
  return isWorkday ? REGULAR_DAY_MINUTES : 0;
}

function na(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'N/A';
}

function shiftSchedule(shift?: string | null): string {
  switch (shift) {
    case 'MORNING':
      return '08:00-17:00';
    case 'AFTERNOON':
      return '14:00-22:00';
    case 'NIGHT':
      return '22:00-06:00';
    default:
      return '—';
  }
}

function resolveVariant(
  isoDate: string,
  hasAttendance: boolean,
  daySummary?: AttendanceCardDaySummary,
): AsistenciaTarjetaRowVariant {
  if (daySummary?.absenceLabel) {
    return daySummary.resolvedKind === 'VACACIONES' ? 'rest' : 'absence';
  }
  if (isColombianHoliday(isoDate)) return 'festive';
  if (isWeekend(isoDate)) return 'rest';
  if (!hasAttendance) return 'absence';
  return 'default';
}

export function mapPayrollEmployeeToCardHeader(
  employee: PayrollEmployee | undefined,
  employerName = 'N/A',
): AsistenciaTarjetaHeaderData {
  if (!employee) {
    return {
      fullName: 'N/A',
      position: 'N/A',
      cedula: 'N/A',
      employer: employerName,
      contractType: 'N/A',
      hireDate: 'N/A',
    };
  }

  return {
    fullName: na(employee.name),
    position: na(employee.position),
    cedula: na(employee.user?.cedula),
    employer: employerName,
    contractType: CONTRACT_LABELS[employee.contractType] ?? employee.contractType,
    hireDate: employee.hireDate ? format(parseISO(employee.hireDate), 'dd/MM/yyyy') : 'N/A',
  };
}

interface DayLogGroup {
  entries: AttendanceHistoryItem[];
  exits: AttendanceHistoryItem[];
}

function groupLogsByWorkDate(logs: AttendanceHistoryItem[]): Map<string, DayLogGroup> {
  const map = new Map<string, DayLogGroup>();
  for (const log of logs) {
    const key = log.workDate.slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { entries: [], exits: [] });
    }
    const group = map.get(key)!;
    if (log.eventType === 'ENTRY') {
      group.entries.push(log);
    } else {
      group.exits.push(log);
    }
  }

  for (const group of map.values()) {
    group.entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    group.exits.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  return map;
}

function computeWorkedMinutes(entry?: AttendanceHistoryItem, exit?: AttendanceHistoryItem): number {
  if (!entry) return 0;
  const exitTime = exit?.timestamp ?? entry.timestamp;
  const diffMs = new Date(exitTime).getTime() - new Date(entry.timestamp).getTime();
  return diffMs > 0 ? Math.floor(diffMs / 60_000) : 0;
}

function parseDuration(value: string): number {
  if (value === '—') return 0;
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function groupObservationsByWorkDate(
  observations: AttendanceObservationDto[],
): Map<string, AttendanceObservationDto> {
  const map = new Map<string, AttendanceObservationDto>();
  for (const observation of observations) {
    map.set(observation.workDate.slice(0, 10), observation);
  }
  return map;
}

export function buildAttendanceCardRows(
  fromIso: string,
  toIso: string,
  logs: AttendanceHistoryItem[],
  observations: AttendanceObservationDto[] = [],
  daySummaries: AttendanceCardDaySummary[] = [],
): AsistenciaTarjetaDayRow[] {
  const grouped = groupLogsByWorkDate(logs);
  const observationsByDate = groupObservationsByWorkDate(observations);
  const summaryByDate = new Map(daySummaries.map((summary) => [summary.workDate, summary]));
  const dates = listIsoDatesInRange(fromIso, toIso);

  return dates.map((isoDate) => {
    const dayGroup = grouped.get(isoDate);
    const entry = dayGroup?.entries[0];
    const exit = dayGroup?.exits[0];
    const observation = observationsByDate.get(isoDate);
    const daySummary = summaryByDate.get(isoDate);

    const entryTimestamp = entry?.timestamp;
    const exitTimestamp = exit?.timestamp;

    const hasManualEntry = entry?.source === 'MANUAL';
    const hasManualExit = exit?.source === 'MANUAL';
    const isAutomaticSource = (source?: AttendanceHistoryItem['source']) =>
      source === 'APP_MOVIL' || source === 'DEVICE';

    const hasAttendance = Boolean(entryTimestamp || exitTimestamp);
    const absenceLabel =
      !hasAttendance && daySummary?.absenceLabel ? daySummary.absenceLabel : null;
    const workedMinutes = computeWorkedMinutes(entry, exit);
    const isWorkday = !isRestOrFestiveDay(isoDate);
    const targetMinutes = summaryTargetMinutes(daySummary, isWorkday);
    const ordinaryMinutes =
      daySummary?.ordinaryMinutes ??
      splitWorkedMinutes(workedMinutes, targetMinutes).ordinaryMinutes;
    const overtimeMinutes =
      daySummary?.overtimeMinutes ??
      splitWorkedMinutes(workedMinutes, targetMinutes).overtimeMinutes;
    const unworkedMinutes =
      daySummary?.unworkedMinutes ??
      (isWorkday && workedMinutes < targetMinutes
        ? targetMinutes - workedMinutes
        : isWorkday && !hasAttendance
          ? targetMinutes
          : 0);

    const variant = resolveVariant(isoDate, hasAttendance, daySummary);
    const shiftName =
      daySummary?.shiftName ??
      (variant === 'rest'
        ? 'Descanso'
        : variant === 'absence'
          ? 'Inasistencia'
          : entry || exit
            ? `ADM.${shiftSchedule(entry?.shift ?? exit?.shift)}`
            : '—');

    return {
      id: isoDate,
      dayShort: format(parseISO(isoDate), 'EEE', { locale: es }).replace('.', ''),
      dateLabel: format(parseISO(isoDate), 'dd/MM/yyyy'),
      shiftName,
      shiftRange:
        daySummary?.shiftRange ??
        (entry || exit ? shiftSchedule(entry?.shift ?? exit?.shift) : '—'),
      entryTime: absenceLabel ?? formatTimeLabel(entryTimestamp),
      exitTime: absenceLabel ?? formatTimeLabel(exitTimestamp),
      ordinaryHours: workedMinutes > 0 || daySummary ? formatMinutesAsHours(ordinaryMinutes) : '—',
      unworkedHours: unworkedMinutes > 0 ? formatMinutesAsHours(unworkedMinutes) : '—',
      overtimeHours: overtimeMinutes > 0 ? formatMinutesAsHours(overtimeMinutes) : '—',
      approvedOvertimeHours: overtimeMinutes > 0 ? formatMinutesAsHours(overtimeMinutes) : '—',
      targetHours:
        daySummary?.targetHours ??
        (isWorkday && targetMinutes > 0 ? formatMinutesAsHours(targetMinutes) : '—'),
      permissions: '00:00:00',
      variant,
      hasObservation: Boolean(observation?.note?.trim()),
      hasManualMarking: hasManualEntry || hasManualExit,
      isAutomaticEntry: Boolean(entry && isAutomaticSource(entry.source)),
      isAutomaticExit: Boolean(exit && isAutomaticSource(exit.source)),
      entryTimeIsStatusLabel: Boolean(absenceLabel),
      exitTimeIsStatusLabel: Boolean(absenceLabel),
    };
  });
}

export function buildAttendanceCardSummaryMetrics(
  rows: AsistenciaTarjetaDayRow[],
): AsistenciaTarjetaMetricData[] {
  let ordinary = 0;
  let unworked = 0;
  let overtime = 0;
  let absences = 0;

  for (const row of rows) {
    ordinary += parseDuration(row.ordinaryHours);
    unworked += parseDuration(row.unworkedHours);
    overtime += parseDuration(row.overtimeHours);

    if (row.variant === 'absence') {
      absences += parseDuration(row.targetHours);
    }
  }

  return [
    {
      id: 'ordinary',
      label: 'Horas ordinarias',
      value: formatMinutesAsHours(ordinary),
      variant: 'ordinary',
    },
    {
      id: 'unworked',
      label: 'Horas no trabajadas',
      value: formatMinutesAsHours(unworked),
      variant: 'unworked',
    },
    {
      id: 'overtime',
      label: 'Horas extraordinarias',
      value: formatMinutesAsHours(overtime),
      variant: 'overtime',
    },
    {
      id: 'permissions',
      label: 'Permisos',
      value: '00:00:00',
      variant: 'permission',
    },
    {
      id: 'absences',
      label: 'Ausencias',
      value: formatMinutesAsHours(absences),
      variant: 'absence',
    },
  ];
}

export function sortAttendanceCardRows(
  rows: AsistenciaTarjetaDayRow[],
  key: AsistenciaTarjetaSortKey,
  direction: AsistenciaTarjetaSortDirection,
): AsistenciaTarjetaDayRow[] {
  const sorted = [...rows].sort((a, b) => {
    const left = String(a[key] ?? '');
    const right = String(b[key] ?? '');
    return left.localeCompare(right, 'es');
  });
  return direction === 'asc' ? sorted : sorted.reverse();
}
