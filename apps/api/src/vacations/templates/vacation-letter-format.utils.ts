const BOGOTA_TZ = 'America/Bogota';

const WEEKDAY_NAMES_ES = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const;

const MONTH_NAMES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

function toBogotaParts(date: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BOGOTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '1970');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
  const weekdayToken = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return { year, month: month - 1, day, weekday: weekdayMap[weekdayToken] ?? 0 };
}

export function formatLetterDateLong(date: Date, city: string): string {
  const { day, month, weekday } = toBogotaParts(date);
  const weekdayName = WEEKDAY_NAMES_ES[weekday] ?? 'lunes';
  const monthName = MONTH_NAMES_ES[month] ?? 'enero';
  const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
  return `${city}, ${capitalizedWeekday}, ${day} de ${monthName} de ${date.getFullYear()}`;
}

export function formatDateShort(date: Date): string {
  const { day, month, year } = toBogotaParts(date);
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

export function formatDateUsShort(date: Date): string {
  const { day, month, year } = toBogotaParts(date);
  return `${month + 1}/${day}/${year}`;
}

export function formatReturnToWorkDate(date: Date): string {
  const { day, month, weekday } = toBogotaParts(date);
  const weekdayName = WEEKDAY_NAMES_ES[weekday] ?? 'lunes';
  const monthName = MONTH_NAMES_ES[month] ?? 'enero';
  const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
  return `${capitalizedWeekday}, ${day} de ${monthName} de ${date.getFullYear()}`;
}

/** Periodo de causación: aniversario laboral completado más reciente antes del inicio de vacaciones. */
export function computeAccrualPeriod(
  hireDate: Date,
  vacationStartDate: Date,
): { start: Date; end: Date } {
  const month = hireDate.getMonth();
  const day = hireDate.getDate();

  let periodEndYear = vacationStartDate.getFullYear();
  let periodEnd = new Date(periodEndYear, month, day);
  periodEnd.setDate(periodEnd.getDate() - 1);

  while (periodEnd >= vacationStartDate) {
    periodEndYear -= 1;
    periodEnd = new Date(periodEndYear, month, day);
    periodEnd.setDate(periodEnd.getDate() - 1);
  }

  const periodStart = new Date(periodEnd);
  periodStart.setFullYear(periodStart.getFullYear() - 1);
  periodStart.setDate(periodStart.getDate() + 1);

  return { start: periodStart, end: periodEnd };
}

export function computeReturnToWorkDate(endDate: Date): Date {
  const next = new Date(endDate);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function formatDaysCount(days: { toNumber(): number } | number): string {
  const value = typeof days === 'number' ? days : days.toNumber();
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
