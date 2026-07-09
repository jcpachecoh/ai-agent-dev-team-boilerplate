import { LeaveOrigin } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import {
  calculateInclusiveCalendarDays,
  calculatePaymentSplit,
  resolveDailySalary,
} from '../utils/medical-leave-payment.utils';

const DAILY_SALARY = new Decimal('100000.00');

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function inclusiveEndDate(start: Date, totalDays: number): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + totalDays - 1);
  return end;
}

describe('calculateInclusiveCalendarDays', () => {
  it('counts inclusive calendar days between two dates', () => {
    // Arrange
    const start = dateOnly(2026, 3, 1);
    const end = dateOnly(2026, 3, 5);

    // Act
    const result = calculateInclusiveCalendarDays(start, end);

    // Assert
    expect(result).toBe(5);
  });

  it('returns 0 when end date is before start date', () => {
    expect(calculateInclusiveCalendarDays(dateOnly(2026, 3, 10), dateOnly(2026, 3, 1))).toBe(0);
  });
});

describe('resolveDailySalary', () => {
  it('divides monthly salary by 30 with half-up rounding', () => {
    // Arrange
    const monthlySalary = new Decimal('3000000.00');

    // Act
    const result = resolveDailySalary(monthlySalary);

    // Assert
    expect(result).toEqual(new Decimal('100000.00'));
  });

  it('rounds half-up to two decimals', () => {
    expect(resolveDailySalary(new Decimal('1000000'))).toEqual(new Decimal('33333.33'));
  });
});

describe('calculatePaymentSplit', () => {
  it('assigns 2 employer days and 3 EPS days for a 5-day COMUN leave', () => {
    // Arrange
    const start = dateOnly(2026, 3, 1);
    const end = inclusiveEndDate(start, 5);

    // Act
    const result = calculatePaymentSplit(LeaveOrigin.COMUN, start, end, DAILY_SALARY);

    // Assert
    expect(result.totalDays).toBe(5);
    expect(result.employerPaidDays).toBe(2);
    expect(result.epsArlPaidDays).toBe(3);
    expect(result.employerAmount).toEqual(new Decimal('200000.00'));
    expect(result.epsArlAmount).toEqual(new Decimal('200010.00'));
    expect(result.warnings).toBeUndefined();
  });

  it('splits a 95-day COMUN leave across employer and both EPS tiers', () => {
    // Arrange
    const start = dateOnly(2026, 1, 1);
    const end = inclusiveEndDate(start, 95);

    // Act
    const result = calculatePaymentSplit(LeaveOrigin.COMUN, start, end, DAILY_SALARY);

    // Assert
    expect(result.totalDays).toBe(95);
    expect(result.employerPaidDays).toBe(2);
    expect(result.epsArlPaidDays).toBe(93);
    expect(result.employerAmount).toEqual(new Decimal('200000.00'));
    expect(result.epsArlAmount).toEqual(new Decimal('6116960.00'));
    expect(result.warnings).toBeUndefined();
  });

  it('assigns all laboral days to ARL at 100% with zero employer share', () => {
    // Arrange
    const start = dateOnly(2026, 4, 1);
    const end = inclusiveEndDate(start, 10);

    // Act
    const result = calculatePaymentSplit(LeaveOrigin.LABORAL, start, end, DAILY_SALARY);

    // Assert
    expect(result.totalDays).toBe(10);
    expect(result.employerPaidDays).toBe(0);
    expect(result.epsArlPaidDays).toBe(10);
    expect(result.employerAmount).toEqual(new Decimal('0'));
    expect(result.epsArlAmount).toEqual(new Decimal('1000000.00'));
  });

  it('warns when a COMUN leave exceeds 180 days and does not assign days beyond 180 to EPS', () => {
    // Arrange
    const start = dateOnly(2026, 1, 1);
    const end = inclusiveEndDate(start, 200);

    // Act
    const result = calculatePaymentSplit(LeaveOrigin.COMUN, start, end, DAILY_SALARY);

    // Assert
    expect(result.totalDays).toBe(200);
    expect(result.employerPaidDays).toBe(2);
    expect(result.epsArlPaidDays).toBe(178);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('supera el límite de 180 días'),
        'El evento supera los 180 días de incapacidad; revisión legal requerida.',
      ]),
    );
    expect(result.warnings).toHaveLength(21);
  });

  it('assigns a single COMUN day entirely to the employer', () => {
    // Arrange
    const start = dateOnly(2026, 5, 10);
    const end = dateOnly(2026, 5, 10);

    // Act
    const result = calculatePaymentSplit(LeaveOrigin.COMUN, start, end, DAILY_SALARY);

    // Assert
    expect(result.totalDays).toBe(1);
    expect(result.employerPaidDays).toBe(1);
    expect(result.epsArlPaidDays).toBe(0);
    expect(result.employerAmount).toEqual(new Decimal('100000.00'));
    expect(result.epsArlAmount).toEqual(new Decimal('0'));
  });

  it('returns zeroed result for invalid date ranges', () => {
    const result = calculatePaymentSplit(
      LeaveOrigin.COMUN,
      dateOnly(2026, 6, 10),
      dateOnly(2026, 6, 1),
      DAILY_SALARY,
    );

    expect(result).toEqual({
      totalDays: 0,
      employerPaidDays: 0,
      epsArlPaidDays: 0,
      employerAmount: new Decimal(0),
      epsArlAmount: new Decimal(0),
    });
  });
});
