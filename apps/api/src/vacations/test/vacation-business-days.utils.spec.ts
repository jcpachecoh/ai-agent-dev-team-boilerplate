import {
  addCalendarDays,
  calculateBusinessDaysInRange,
  getEarliestVacationStartDateString,
  isVacationStartDateAllowed,
} from '../utils/vacation-business-days.utils';

describe('vacation-business-days.utils', () => {
  const reference = new Date('2026-07-14T15:00:00.000Z');

  describe('getEarliestVacationStartDateString', () => {
    it('returns today + 15 days in America/Bogota', () => {
      expect(getEarliestVacationStartDateString(reference)).toBe('2026-07-29');
    });
  });

  describe('isVacationStartDateAllowed', () => {
    it('rejects start dates within the next 15 days', () => {
      expect(isVacationStartDateAllowed(new Date('2026-07-20T00:00:00.000Z'), reference)).toBe(
        false,
      );
    });

    it('allows start dates on or after today + 15 days', () => {
      expect(isVacationStartDateAllowed(new Date('2026-07-29T00:00:00.000Z'), reference)).toBe(
        true,
      );
    });
  });

  describe('calculateBusinessDaysInRange', () => {
    it('excludes Saturdays and Sundays from the count', () => {
      const days = calculateBusinessDaysInRange(
        new Date('2026-08-01T00:00:00.000Z'),
        new Date('2026-08-05T00:00:00.000Z'),
      );

      expect(days).toBe(3);
    });

    it('returns zero for weekend-only ranges', () => {
      const days = calculateBusinessDaysInRange(
        new Date('2026-08-01T00:00:00.000Z'),
        new Date('2026-08-02T00:00:00.000Z'),
      );

      expect(days).toBe(0);
    });
  });

  describe('addCalendarDays', () => {
    it('adds calendar days across month boundaries', () => {
      expect(addCalendarDays('2026-07-29', 5)).toBe('2026-08-03');
    });
  });
});
