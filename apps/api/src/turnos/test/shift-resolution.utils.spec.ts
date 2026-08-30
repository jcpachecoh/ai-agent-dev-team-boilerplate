import {
  computeShiftTargetMinutes,
  getUtcDayOfWeek,
  parseHhMmToMinutes,
} from '../shift-resolution.utils';

describe('shift-resolution.utils', () => {
  describe('parseHhMmToMinutes', () => {
    it('convierte HH:mm a minutos', () => {
      expect(parseHhMmToMinutes('08:00')).toBe(480);
      expect(parseHhMmToMinutes('06:30')).toBe(390);
    });
  });

  describe('computeShiftTargetMinutes', () => {
    it('calcula jornada diurna', () => {
      expect(computeShiftTargetMinutes('08:00', '16:00')).toBe(480);
      expect(computeShiftTargetMinutes('06:00', '12:00')).toBe(360);
    });

    it('calcula jornada nocturna que cruza medianoche', () => {
      expect(computeShiftTargetMinutes('22:00', '06:00')).toBe(480);
    });
  });

  describe('getUtcDayOfWeek', () => {
    it('usa convención 0=domingo', () => {
      // 2026-07-05 is Sunday
      expect(getUtcDayOfWeek(new Date('2026-07-05T12:00:00.000Z'))).toBe(0);
      // 2026-07-06 is Monday
      expect(getUtcDayOfWeek(new Date('2026-07-06T12:00:00.000Z'))).toBe(1);
    });
  });
});
