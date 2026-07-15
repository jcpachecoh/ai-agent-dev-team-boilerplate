import { calculateLutoEndDate, isBusinessDay } from '../utils/luto-end-date.util';

describe('luto-end-date.util', () => {
  describe('isBusinessDay', () => {
    it('returns false for Saturday and Sunday', () => {
      expect(isBusinessDay(new Date('2026-07-04T00:00:00.000Z'))).toBe(false);
      expect(isBusinessDay(new Date('2026-07-05T00:00:00.000Z'))).toBe(false);
    });

    it('returns false for Colombian holidays', () => {
      expect(isBusinessDay(new Date('2025-04-18T00:00:00.000Z'))).toBe(false);
    });

    it('returns true for regular weekdays', () => {
      expect(isBusinessDay(new Date('2026-07-06T00:00:00.000Z'))).toBe(true);
    });
  });

  describe('calculateLutoEndDate', () => {
    it('counts 5 business days from a Friday through the next week', () => {
      const endDate = calculateLutoEndDate(new Date('2026-07-03T00:00:00.000Z'));
      expect(endDate.toISOString().slice(0, 10)).toBe('2026-07-09');
    });

    it('extends through Holy Week when start is Wednesday before Easter 2025', () => {
      const endDate = calculateLutoEndDate(new Date('2025-04-16T00:00:00.000Z'));
      expect(endDate.toISOString().slice(0, 10)).toBe('2025-04-24');
    });

    it('extends when a Friday holiday falls in the range (product example pattern)', () => {
      const endDate = calculateLutoEndDate(new Date('2025-04-16T00:00:00.000Z'));
      expect(endDate.getTime()).toBeGreaterThan(new Date('2025-04-18T00:00:00.000Z').getTime());
    });
  });
});
