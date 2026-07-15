import { isColombianHoliday } from '../../reports/service/colombia-holidays.util';

export const LUTO_BUSINESS_DAYS = 5;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Lun–vie excl. festivo legal colombiano. */
export function isBusinessDay(date: Date): boolean {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) {
    return false;
  }
  return !isColombianHoliday(toIsoDate(date));
}

/**
 * Ley 1280/2009 — 5 días hábiles remunerados desde startDate (inclusive).
 * Sábados, domingos y festivos legales no consumen uno de los 5 días.
 */
export function calculateLutoEndDate(startDate: Date): Date {
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);

  let counted = 0;
  while (counted < LUTO_BUSINESS_DAYS) {
    if (isBusinessDay(cursor)) {
      counted += 1;
      if (counted === LUTO_BUSINESS_DAYS) {
        return new Date(cursor);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return new Date(cursor);
}
