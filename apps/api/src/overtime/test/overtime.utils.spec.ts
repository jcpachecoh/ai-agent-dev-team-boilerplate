import { computeExcessMinutes, computeShiftEndDateTime } from '../utils/shift-end.util';
import {
  formatPayrollPeriod,
  payrollPeriodFromYearMonth,
  payrollPeriodToWorkDateRange,
} from '../utils/overtime-period.util';

describe('overtime utils', () => {
  it('computeShiftEndDateTime soporta cruce de medianoche', () => {
    const workDate = new Date('2026-07-10T00:00:00.000Z');
    const end = computeShiftEndDateTime(workDate, '22:00', '06:00');
    expect(end.getUTCDate()).toBe(11);
    expect(end.getUTCHours()).toBe(6);
  });

  it('computeExcessMinutes retorna 0 si sale antes del turno', () => {
    const shiftEnd = new Date('2026-07-10T23:00:00.000Z');
    const actual = new Date('2026-07-10T22:50:00.000Z');
    expect(computeExcessMinutes(actual, shiftEnd)).toBe(0);
  });

  it('formatPayrollPeriod usa YYYY-MM', () => {
    expect(formatPayrollPeriod(new Date('2026-07-15T00:00:00.000Z'))).toBe('2026-07');
  });

  it('payrollPeriodToWorkDateRange cubre todo el mes', () => {
    const range = payrollPeriodToWorkDateRange('2026-07');
    expect(range.workDateFrom.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(range.workDateTo.toISOString()).toBe('2026-07-31T00:00:00.000Z');
  });

  it('payrollPeriodFromYearMonth formatea con cero', () => {
    expect(payrollPeriodFromYearMonth(2026, 3)).toBe('2026-03');
  });
});
