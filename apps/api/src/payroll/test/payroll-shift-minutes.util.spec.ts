import { splitPayrollMinutesAgainstTarget } from '../utils/payroll-shift-minutes.util';

describe('payroll-shift-minutes.util', () => {
  it('usa target del turno (6h) en lugar de 8h fijas', () => {
    const result = splitPayrollMinutesAgainstTarget(420, 360);
    expect(result.regularMinutes).toBe(360);
    expect(result.overtimeMinutes).toBe(60);
  });

  it('sin horas extra cuando worked <= target', () => {
    const result = splitPayrollMinutesAgainstTarget(300, 360);
    expect(result.regularMinutes).toBe(300);
    expect(result.overtimeMinutes).toBe(0);
  });
});
