import {
  buildWeekDates,
  daysBetween,
  expandDatesInRange,
  formatDateOnly,
  getMondayOfWeek,
  parseDateOnly,
  toIsoWeekday,
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

  describe('toIsoWeekday', () => {
    it('lunes es 1 y domingo es 7', () => {
      expect(toIsoWeekday(parseDateOnly('2026-07-06'))).toBe(1);
      expect(toIsoWeekday(parseDateOnly('2026-07-12'))).toBe(7);
    });
  });

  describe('daysBetween', () => {
    it('calcula la cantidad de días entre dos fechas', () => {
      expect(daysBetween(parseDateOnly('2026-08-01'), parseDateOnly('2026-08-31'))).toBe(30);
      expect(daysBetween(parseDateOnly('2026-08-01'), parseDateOnly('2026-08-01'))).toBe(0);
    });
  });

  describe('expandDatesInRange', () => {
    it('expande solo las fechas cuyo día ISO está en weekdaysIso (lunes-viernes)', () => {
      const dates = expandDatesInRange(
        parseDateOnly('2026-08-03'), // lunes
        parseDateOnly('2026-08-09'), // domingo
        [1, 2, 3, 4, 5],
      ).map(formatDateOnly);

      expect(dates).toEqual(['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07']);
    });

    it('incluye solo sábados y domingos si se piden esos días', () => {
      const dates = expandDatesInRange(
        parseDateOnly('2026-08-03'),
        parseDateOnly('2026-08-09'),
        [6, 7],
      ).map(formatDateOnly);

      expect(dates).toEqual(['2026-08-08', '2026-08-09']);
    });

    it('retorna vacío si from y to son el mismo día pero no coincide con weekdaysIso', () => {
      const dates = expandDatesInRange(
        parseDateOnly('2026-08-03'), // lunes
        parseDateOnly('2026-08-03'),
        [7],
      );
      expect(dates).toEqual([]);
    });
  });
});
