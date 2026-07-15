import { isColombianHoliday } from './colombia-holidays.util';

const LUTO_BUSINESS_DAYS = 5;

export function isBusinessDay(date: Date): boolean {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) {
    return false;
  }
  return !isColombianHoliday(date.toISOString().slice(0, 10));
}

export function calculateLutoEndDateFromIso(startDateIso: string): string {
  const cursor = new Date(`${startDateIso}T00:00:00.000Z`);
  let counted = 0;

  while (counted < LUTO_BUSINESS_DAYS) {
    if (isBusinessDay(cursor)) {
      counted += 1;
      if (counted === LUTO_BUSINESS_DAYS) {
        return cursor.toISOString().slice(0, 10);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return cursor.toISOString().slice(0, 10);
}
