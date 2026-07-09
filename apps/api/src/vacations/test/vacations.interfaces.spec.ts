import { calculateMonthlyAccrual } from '../interfaces/vacations.interfaces';

describe('vacations.interfaces calculateMonthlyAccrual', () => {
  it('accrues 1.25 days for a full worked month', () => {
    const result = calculateMonthlyAccrual(new Date('2024-01-01'), new Date('2024-06-15'));
    expect(result).toBe(1.25);
  });

  it('returns 0 when hire date is after the accrual month', () => {
    const result = calculateMonthlyAccrual(new Date(2024, 4, 10), new Date(2024, 3, 1));
    expect(result).toBe(0);
  });

  it('prorates hire on day 15 in a 31-day month', () => {
    const result = calculateMonthlyAccrual(new Date(2024, 2, 15), new Date(2024, 2, 1));
    expect(result).toBe(0.69);
  });
});
