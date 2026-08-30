export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Normaliza cualquier fecha a el lunes de su semana ISO (lunes-domingo), en UTC. */
export function getMondayOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);
  return new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
}

export function buildWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index): Date => {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + index);
    return date;
  });
}

/** Día ISO de la semana (1=lunes ... 7=domingo), en UTC. */
export function toIsoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** OS-583 — expande un rango [from, to] a las fechas cuyo día ISO está en weekdaysIso. */
export function expandDatesInRange(from: Date, to: Date, weekdaysIso: number[]): Date[] {
  const allowed = new Set(weekdaysIso);
  const dates: Date[] = [];
  let cursor = from;
  while (cursor.getTime() <= to.getTime()) {
    if (allowed.has(toIsoWeekday(cursor))) {
      dates.push(cursor);
    }
    cursor = addDaysUtc(cursor, 1);
  }
  return dates;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}
