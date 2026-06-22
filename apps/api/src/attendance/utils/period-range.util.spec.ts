import {
  enumerateWorkDates,
  isLiveAttendancePeriod,
  resolveAttendancePeriodRange,
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
});
