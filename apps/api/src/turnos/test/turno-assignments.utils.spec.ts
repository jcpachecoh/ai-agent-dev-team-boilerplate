import {
  buildWeekDates,
  formatDateOnly,
  getMondayOfWeek,
  parseDateOnly,
} from '../turno-assignments.utils';

describe('turno-assignments.utils', () => {
  describe('parseDateOnly / formatDateOnly', () => {
    it('parsea y formatea de vuelta la misma fecha en UTC', () => {
      const date = parseDateOnly('2026-07-08');
      expect(formatDateOnly(date)).toBe('2026-07-08');
    });
  });

  describe('getMondayOfWeek', () => {
    it('normaliza un miércoles al lunes de esa semana', () => {
      const monday = getMondayOfWeek(parseDateOnly('2026-07-08'));
      expect(formatDateOnly(monday)).toBe('2026-07-06');
    });

    it('un domingo pertenece a la semana que empezó el lunes anterior', () => {
      const monday = getMondayOfWeek(parseDateOnly('2026-07-12'));
      expect(formatDateOnly(monday)).toBe('2026-07-06');
    });

    it('un lunes se mantiene igual', () => {
      const monday = getMondayOfWeek(parseDateOnly('2026-07-06'));
      expect(formatDateOnly(monday)).toBe('2026-07-06');
    });
  });

  describe('buildWeekDates', () => {
    it('genera 7 fechas consecutivas lunes-domingo', () => {
      const dates = buildWeekDates(parseDateOnly('2026-07-06')).map(formatDateOnly);
      expect(dates).toEqual([
        '2026-07-06',
        '2026-07-07',
        '2026-07-08',
        '2026-07-09',
        '2026-07-10',
        '2026-07-11',
        '2026-07-12',
      ]);
    });
  });
});
