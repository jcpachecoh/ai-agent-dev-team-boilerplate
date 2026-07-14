import { LeaveOrigin, NovedadType } from '@prisma/client';
import { NOVEDAD_TYPE_LABELS } from '@restopsiq/shared';

import { formatCalendarDate, listDatesInRange } from './attendance-calculation.util';

const MEDICAL_LEAVE_ORIGIN_LABELS: Record<LeaveOrigin, string> = {
  COMUN: 'Enfermedad común',
  LABORAL: 'Accidente laboral',
};

export interface AttendanceCardAbsenceRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export function buildAttendanceCardAbsenceLabelMap(
  dateFrom: Date,
  dateTo: Date,
  ranges: AttendanceCardAbsenceRange[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const range of ranges) {
    const rangeStart = range.startDate < dateFrom ? dateFrom : range.startDate;
    const rangeEnd = range.endDate > dateTo ? dateTo : range.endDate;
    if (rangeStart > rangeEnd) {
      continue;
    }

    for (const day of listDatesInRange(rangeStart, rangeEnd)) {
      map.set(formatCalendarDate(day), range.label);
    }
  }

  return map;
}

export function mapPayrollNovedadRangesToAbsenceRanges(
  rows: Array<{ startDate: Date; endDate: Date; type: NovedadType }>,
): AttendanceCardAbsenceRange[] {
  return rows.map((row) => ({
    startDate: row.startDate,
    endDate: row.endDate,
    label: NOVEDAD_TYPE_LABELS[row.type as keyof typeof NOVEDAD_TYPE_LABELS] ?? row.type,
  }));
}

export function mapMedicalLeaveRangesToAbsenceRanges(
  rows: Array<{ startDate: Date; endDate: Date; origin: LeaveOrigin }>,
): AttendanceCardAbsenceRange[] {
  return rows.map((row) => ({
    startDate: row.startDate,
    endDate: row.endDate,
    label: MEDICAL_LEAVE_ORIGIN_LABELS[row.origin],
  }));
}

export function mergeAttendanceCardAbsenceLabelMaps(
  ...maps: Array<Map<string, string>>
): Map<string, string> {
  const merged = new Map<string, string>();
  for (const map of maps) {
    for (const [key, label] of map) {
      merged.set(key, label);
    }
  }
  return merged;
}
