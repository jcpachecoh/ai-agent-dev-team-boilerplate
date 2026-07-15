import { Decimal } from '@prisma/client/runtime/library';

import {
  calculateMonthlyAccrual,
  formatYearMonth,
  projectAccrualThrough,
} from '../utils/vacation-accrual.utils';

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

// OS-591 (fase 1) — proyección pura reutilizada por VacationAccrualService.syncEmployeeBalance
// (que persiste) y VacationsService.calculateBalanceAsOf (que solo previsualiza).
describe('projectAccrualThrough', (): void => {
  it('acumula desde cero para un empleado sin balance previo (lastAccrualDate epoch)', (): void => {
    // Arrange
    const hireDate = new Date(2026, 0, 1);

    // Act
    const result = projectAccrualThrough(
      hireDate,
      new Decimal(0),
      new Date(0),
      new Date(2026, 2, 15),
    );

    // Assert — enero + febrero completos = 2.5 días
    expect(result.accruedDays.toNumber()).toBe(2.5);
    expect(result.monthsAccrued).toBe(2);
  });

  it('continúa desde un balance existente sin reprocesar meses ya acreditados', (): void => {
    // Arrange
    const hireDate = new Date(2026, 0, 1);
    const existingAccruedDays = new Decimal(1.25); // enero ya acreditado
    const existingLastAccrualDate = new Date(2026, 0, 1);

    // Act
    const result = projectAccrualThrough(
      hireDate,
      existingAccruedDays,
      existingLastAccrualDate,
      new Date(2026, 2, 15),
    );

    // Assert — solo febrero se agrega (1.25), no se duplica enero
    expect(result.accruedDays.toNumber()).toBe(2.5);
    expect(result.monthsAccrued).toBe(1);
  });

  it('no acumula meses adicionales si asOfDate cae en el mismo mes que lastAccrualDate', (): void => {
    // Arrange
    const hireDate = new Date(2026, 0, 1);
    const existingAccruedDays = new Decimal(1.25);
    const existingLastAccrualDate = new Date(2026, 0, 1);

    // Act
    const result = projectAccrualThrough(
      hireDate,
      existingAccruedDays,
      existingLastAccrualDate,
      new Date(2026, 0, 20), // mismo mes de contratación, aún no cierra febrero
    );

    // Assert
    expect(result.accruedDays.toNumber()).toBe(1.25);
    expect(result.monthsAccrued).toBe(0);
  });
});
