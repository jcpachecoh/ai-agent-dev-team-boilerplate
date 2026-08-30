export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getMondayOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);
  return new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
}

export function addWeeks(weekStart: Date, weeks: number): Date {
  const result = new Date(weekStart);
  result.setUTCDate(result.getUTCDate() + weeks * 7);
  return result;
}

export function todayDateOnly(): string {
  return formatDateOnly(new Date());
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function weekdayLabel(index: number): string {
  return WEEKDAY_LABELS[index] ?? '';
}

export function formatDayMonth(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatWeekRangeLabel(dates: string[]): string {
  if (dates.length === 0) return '';
  return `${formatDayMonth(dates[0])} – ${formatDayMonth(dates[dates.length - 1])}`;
}

// OS-583 — Asignación masiva de Turnos

/** Día ISO de la semana (1=lunes...7=domingo), en UTC. */
export function toIsoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/** Expande [from, to] a las fechas cuyo día ISO está en weekdaysIso (mismo criterio que el backend). */
export function expandDatesInRange(from: Date, to: Date, weekdaysIso: number[]): Date[] {
  const allowed = new Set(weekdaysIso);
  const dates: Date[] = [];
  let cursor = from;
  while (cursor.getTime() <= to.getTime()) {
    if (allowed.has(toIsoWeekday(cursor))) {
      dates.push(cursor);
    }
    const next = new Date(cursor);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next;
  }
  return dates;
}
