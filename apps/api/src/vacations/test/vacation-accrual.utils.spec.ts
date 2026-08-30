import { calculateMonthlyAccrual, formatYearMonth } from '../utils/vacation-accrual.utils';

describe('calculateMonthlyAccrual', () => {
  it('accrues 1.25 days for a full worked month', () => {
    // Arrange
    const hireDate = new Date('2024-01-01');
    const accrualMonth = new Date('2024-06-15');

    // Act
    const result = calculateMonthlyAccrual(hireDate, accrualMonth);

    // Assert
    expect(result).toBe(1.25);
  });

  it('prorates hire on day 15 in a 31-day month', () => {
    // Arrange
    const hireDate = new Date(2024, 2, 15);
    const accrualMonth = new Date(2024, 2, 1);

    // Act
    const result = calculateMonthlyAccrual(hireDate, accrualMonth);

    // Assert
    expect(result).toBeCloseTo((17 / 31) * 1.25, 2);
    expect(result).toBe(0.69);
  });

  it('prorates hire on day 15 in a 30-day month', () => {
    // Arrange
    const hireDate = new Date(2024, 3, 15);
    const accrualMonth = new Date(2024, 3, 1);

    // Act
    const result = calculateMonthlyAccrual(hireDate, accrualMonth);

    // Assert
    expect(result).toBeCloseTo((16 / 30) * 1.25, 2);
    expect(result).toBe(0.67);
  });

  it('returns 0 when hire date is after the accrual month', () => {
    // Arrange
    const hireDate = new Date(2024, 4, 10);
    const accrualMonth = new Date(2024, 3, 1);

    // Act
    const result = calculateMonthlyAccrual(hireDate, accrualMonth);

    // Assert
    expect(result).toBe(0);
  });

  it('prorates a single worked day on leap-year February', () => {
    // Arrange
    const hireDate = new Date(2024, 1, 29);
    const accrualMonth = new Date(2024, 1, 1);

    // Act
    const result = calculateMonthlyAccrual(hireDate, accrualMonth);

    // Assert
    expect(result).toBeCloseTo((1 / 29) * 1.25, 2);
    expect(result).toBe(0.04);
  });
});

describe('formatYearMonth', () => {
  it('formats month with leading zero', () => {
    expect(formatYearMonth(new Date(2026, 6, 9))).toBe('2026-07');
  });
});
