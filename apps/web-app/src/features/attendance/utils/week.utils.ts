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
