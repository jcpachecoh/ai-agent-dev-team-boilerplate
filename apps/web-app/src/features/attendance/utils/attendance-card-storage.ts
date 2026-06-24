import type { AsistenciaTarjetaMarkDraft, AsistenciaTarjetaMarkType } from '@restopsiq/ui';

import type {
  AttendanceCardDayMarkings,
  AttendanceCardManualMarking,
  AttendanceCardMarkEntry,
  AttendanceCardObservation,
  AttendanceMarkingType,
} from '../types/attendance-card.types';

const OBS_KEY = 'restopsiq.attendance-card.observations';
const MARK_KEY = 'restopsiq.attendance-card.manual-markings';
const DAY_MARK_KEY = 'restopsiq.attendance-card.day-markings';

function readMap<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, T>;
  } catch {
    return {};
  }
}

function writeMap<T>(key: string, value: Record<string, T>): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function dayKey(employeeId: string, isoDate: string): string {
  return `${employeeId}:${isoDate}`;
}

export function getObservation(
  employeeId: string,
  isoDate: string,
): AttendanceCardObservation | undefined {
  const map = readMap<AttendanceCardObservation>(OBS_KEY);
  return map[dayKey(employeeId, isoDate)];
}

export function saveObservation(
  employeeId: string,
  isoDate: string,
  text: string,
): AttendanceCardObservation {
  const map = readMap<AttendanceCardObservation>(OBS_KEY);
  const entry: AttendanceCardObservation = { text, updatedAt: new Date().toISOString() };
  map[dayKey(employeeId, isoDate)] = entry;
  writeMap(OBS_KEY, map);
  return entry;
}

function migrateLegacyMarking(
  legacy: AttendanceCardManualMarking,
  isoDate: string,
): AttendanceCardDayMarkings {
  return {
    marks: [
      {
        id: `legacy-${isoDate}-${legacy.type}`,
        type: legacy.type,
        timestamp: `${isoDate}T${legacy.time.length === 5 ? `${legacy.time}:00` : legacy.time}`,
      },
    ],
    changeReason: '',
    updatedAt: legacy.updatedAt,
    updatedBy: legacy.updatedBy,
  };
}

export function getDayMarkings(
  employeeId: string,
  isoDate: string,
): AttendanceCardDayMarkings | undefined {
  const dayMap = readMap<AttendanceCardDayMarkings>(DAY_MARK_KEY);
  const stored = dayMap[dayKey(employeeId, isoDate)];
  if (stored) return stored;

  const legacyMap = readMap<AttendanceCardManualMarking>(MARK_KEY);
  const legacy = legacyMap[dayKey(employeeId, isoDate)];
  if (!legacy) return undefined;

  return migrateLegacyMarking(legacy, isoDate);
}

export function saveDayMarkings(
  employeeId: string,
  isoDate: string,
  markings: Omit<AttendanceCardDayMarkings, 'updatedAt'>,
): AttendanceCardDayMarkings {
  const map = readMap<AttendanceCardDayMarkings>(DAY_MARK_KEY);
  const entry: AttendanceCardDayMarkings = {
    ...markings,
    updatedAt: new Date().toISOString(),
  };
  map[dayKey(employeeId, isoDate)] = entry;
  writeMap(DAY_MARK_KEY, map);

  const legacyMap = readMap<AttendanceCardManualMarking>(MARK_KEY);
  delete legacyMap[dayKey(employeeId, isoDate)];
  writeMap(MARK_KEY, legacyMap);

  return entry;
}

export function toDatetimeLocalValue(isoDate: string, fallbackTime = '08:00:00'): string {
  const parts = fallbackTime.split(':');
  const hours = (parts[0] ?? '08').padStart(2, '0');
  const minutes = (parts[1] ?? '00').padStart(2, '0');
  const seconds = (parts[2] ?? '00').padStart(2, '0');
  return `${isoDate}T${hours}:${minutes}:${seconds}`;
}

export function marksToDrafts(
  isoDate: string,
  markings: AttendanceCardDayMarkings | undefined,
): AsistenciaTarjetaMarkDraft[] {
  if (!markings?.marks.length) {
    return [createMarkDraft(isoDate, 'ENTRY')];
  }

  return markings.marks.map((mark) => ({
    id: mark.id,
    type: mark.type,
    datetimeLocal: toDatetimeLocalFromTimestamp(mark.timestamp),
  }));
}

export function toDatetimeLocalFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp.includes('T') ? timestamp.slice(0, 19) : timestamp;
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function createMarkDraft(
  isoDate: string,
  type: AsistenciaTarjetaMarkType = 'ENTRY',
): AsistenciaTarjetaMarkDraft {
  return {
    id: crypto.randomUUID(),
    type,
    datetimeLocal: toDatetimeLocalValue(isoDate, type === 'ENTRY' ? '08:00:00' : '17:00:00'),
  };
}

export function draftsToMarkEntries(
  drafts: AsistenciaTarjetaMarkDraft[],
): AttendanceCardMarkEntry[] {
  return drafts.map((draft) => ({
    id: draft.id,
    type: draft.type as AttendanceMarkingType,
    timestamp: new Date(draft.datetimeLocal).toISOString(),
  }));
}

export function nextMarkType(existing: AsistenciaTarjetaMarkDraft[]): AsistenciaTarjetaMarkType {
  const hasEntry = existing.some((mark) => mark.type === 'ENTRY');
  const hasExit = existing.some((mark) => mark.type === 'EXIT');
  if (!hasEntry) return 'ENTRY';
  if (!hasExit) return 'EXIT';
  return 'ENTRY';
}
