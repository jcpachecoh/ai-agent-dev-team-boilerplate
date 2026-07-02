import {
  enumerateWorkDates,
  getBogotaDateParts,
  getTodayAnchorDate,
  isLiveAttendancePeriod,
  resolveAttendancePeriodRange,
  resolvePreviousAttendancePeriodRange,
  workDateFromIso,
} from './period-range.util';

describe('period-range.util', () => {
  it('resuelve rango de día', () => {
    expect(resolveAttendancePeriodRange('day', '2026-06-18')).toEqual({
      period: 'day',
      anchorDate: '2026-06-18',
      dateFrom: '2026-06-18',
      dateTo: '2026-06-18',
    });
  });

  it('resuelve rango semanal (lunes a domingo)', () => {
    const range = resolveAttendancePeriodRange('week', '2026-06-18');
    expect(range.dateFrom).toBe('2026-06-15');
    expect(range.dateTo).toBe('2026-06-21');
  });

  it('resuelve rango mensual', () => {
    const range = resolveAttendancePeriodRange('month', '2026-06-18');
    expect(range.dateFrom).toBe('2026-06-01');
    expect(range.dateTo).toBe('2026-06-30');
  });

  it('resuelve rango anual', () => {
    const range = resolveAttendancePeriodRange('year', '2026-06-18');
    expect(range.dateFrom).toBe('2026-01-01');
    expect(range.dateTo).toBe('2026-12-31');
  });

  it('enumera fechas inclusive', () => {
    expect(enumerateWorkDates('2026-06-01', '2026-06-03')).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
    ]);
  });

  it('resuelve periodo anterior de día, semana y mes', () => {
    expect(resolvePreviousAttendancePeriodRange('day', '2026-07-01')).toEqual({
      dateFrom: '2026-06-30',
      dateTo: '2026-06-30',
    });

    expect(resolvePreviousAttendancePeriodRange('week', '2026-07-01')).toEqual({
      dateFrom: '2026-06-22',
      dateTo: '2026-06-28',
    });

    expect(resolvePreviousAttendancePeriodRange('month', '2026-07-01')).toEqual({
      dateFrom: '2026-06-01',
      dateTo: '2026-06-30',
    });
  });

  it('detecta periodo live solo para día actual', () => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    expect(isLiveAttendancePeriod('day', today)).toBe(true);
    expect(isLiveAttendancePeriod('week', today)).toBe(false);
    expect(isLiveAttendancePeriod('day', '2020-01-01')).toBe(false);
  });

  it('resuelve semana cuando el ancla cae en domingo', () => {
    const range = resolveAttendancePeriodRange('week', '2026-06-21');
    expect(range.dateFrom).toBe('2026-06-15');
    expect(range.dateTo).toBe('2026-06-21');
  });

  it('resuelve periodo anterior de año y enero', () => {
    expect(resolvePreviousAttendancePeriodRange('year', '2026-06-18')).toEqual({
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
    });
    expect(resolvePreviousAttendancePeriodRange('month', '2026-01-31')).toEqual({
      dateFrom: '2025-12-01',
      dateTo: '2025-12-31',
    });
  });

  it('expone helpers de fecha y valida anchor inválido', () => {
    expect(getTodayAnchorDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getTodayAnchorDate('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getBogotaDateParts(new Date('2026-07-01T15:00:00.000Z'))).toEqual({
      year: 2026,
      month: 7,
      day: 1,
    });
    expect(workDateFromIso('2026-07-01').toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(() => resolveAttendancePeriodRange('day', 'invalid-date')).toThrow(
      'Invalid anchorDate: invalid-date',
    );
  });

  it('limita enumerateWorkDates a 401 fechas como máximo', () => {
    const dates = enumerateWorkDates('2020-01-01', '2025-12-31');

    expect(dates).toHaveLength(401);
    expect(dates[0]).toBe('2020-01-01');
    expect(dates.at(-1)).toBe('2021-02-04');
  });

  it('detecta periodo live con zona horaria explícita', () => {
    const todayUtc = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    expect(isLiveAttendancePeriod('day', todayUtc, 'UTC')).toBe(true);
    expect(isLiveAttendancePeriod('day', '2020-01-01', 'UTC')).toBe(false);
  });
});
