const DAY_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const TURNO_DAY_OPTIONS = WEEK_ORDER.map((day) => ({
  value: day,
  label: DAY_LABELS[day],
}));

export function formatTurnoDaysOfWeek(daysOfWeek: number[]): string {
  if (!daysOfWeek.length) {
    return '—';
  }

  const selected = new Set(daysOfWeek);
  return WEEK_ORDER.filter((day) => selected.has(day))
    .map((day) => DAY_LABELS[day])
    .join(' · ');
}
