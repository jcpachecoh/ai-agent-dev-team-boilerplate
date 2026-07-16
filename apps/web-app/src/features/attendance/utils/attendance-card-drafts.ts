import type { AsistenciaTarjetaMarkDraft, AsistenciaTarjetaMarkType } from '@restopsiq/ui';

export function toDatetimeLocalValue(isoDate: string, fallbackTime = '08:00:00'): string {
  const parts = fallbackTime.split(':');
  const hours = (parts[0] ?? '08').padStart(2, '0');
  const minutes = (parts[1] ?? '00').padStart(2, '0');
  const seconds = (parts[2] ?? '00').padStart(2, '0');
  return `${isoDate}T${hours}:${minutes}:${seconds}`;
}

export function createMarkDraft(
  isoDate: string,
  type: AsistenciaTarjetaMarkType = 'ENTRY',
): AsistenciaTarjetaMarkDraft {
  return {
    id: crypto.randomUUID(),
    type,
    // EXIT default 16:00 alinea turnos seed demo (08:00–16:00); antes 17:00 fallaba ventana ±30m.
    datetimeLocal: toDatetimeLocalValue(isoDate, type === 'ENTRY' ? '08:00:00' : '16:00:00'),
  };
}

export function nextMarkType(existing: AsistenciaTarjetaMarkDraft[]): AsistenciaTarjetaMarkType {
  const hasEntry = existing.some((mark) => mark.type === 'ENTRY');
  const hasExit = existing.some((mark) => mark.type === 'EXIT');
  if (!hasEntry) return 'ENTRY';
  if (!hasExit) return 'EXIT';
  return 'ENTRY';
}
