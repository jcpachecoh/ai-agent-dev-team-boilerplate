import { LeaveOrigin } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import type { MedicalLeavePayrollPeriodRange } from '../../medical-leaves/interfaces/medical-leaves.interfaces';
import { calculateMedicalLeaveMonthAdjustment } from '../utils/medical-leave-payroll.utils';

const DAILY_SALARY = 100_000;

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function makeLeave(
  overrides: Partial<MedicalLeavePayrollPeriodRange> &
    Pick<MedicalLeavePayrollPeriodRange, 'startDate' | 'endDate'>,
): MedicalLeavePayrollPeriodRange {
  return {
    id: 'leave-1',
    employeeId: 'emp-1',
    origin: LeaveOrigin.COMUN,
    totalDays: 8,
    employerPaidDays: 2,
    epsArlPaidDays: 6,
    employerAmount: new Decimal('200000'),
    epsArlAmount: new Decimal('400020'),
    ...overrides,
  };
}

describe('calculateMedicalLeaveMonthAdjustment', () => {
  it('allocates 2 employer days and 3 EPS days for a 5-day COMUN leave in one month', () => {
    const result = calculateMedicalLeaveMonthAdjustment(
      [
        makeLeave({
          startDate: dateOnly(2026, 3, 1),
          endDate: dateOnly(2026, 3, 5),
        }),
      ],
      dateOnly(2026, 3, 1),
      dateOnly(2026, 3, 31),
      DAILY_SALARY,
    );

    expect(result.medicalLeaveEmployerDays).toBe(2);
    expect(result.medicalLeaveEpsArlDays).toBe(3);
    expect(result.medicalLeaveEmployerPay).toBe(200_000);
    expect(result.medicalLeaveEpsArlPay).toBe(200_010);
    expect(result.medicalLeaveOrdinaryDaysExcluded).toBe(3);
  });

  it('allocates all laboral days to ARL with zero employer pay', () => {
    const result = calculateMedicalLeaveMonthAdjustment(
      [
        makeLeave({
          origin: LeaveOrigin.LABORAL,
          startDate: dateOnly(2026, 4, 1),
          endDate: dateOnly(2026, 4, 10),
        }),
      ],
      dateOnly(2026, 4, 1),
      dateOnly(2026, 4, 30),
      DAILY_SALARY,
    );

    expect(result.medicalLeaveEmployerDays).toBe(0);
    expect(result.medicalLeaveEmployerPay).toBe(0);
    expect(result.medicalLeaveEpsArlDays).toBe(10);
    expect(result.medicalLeaveEpsArlPay).toBe(1_000_000);
    expect(result.medicalLeaveOrdinaryDaysExcluded).toBe(10);
  });

  it('prorates a leave crossing July and August independently per month', () => {
    const leave = makeLeave({
      startDate: dateOnly(2026, 7, 28),
      endDate: dateOnly(2026, 8, 5),
      totalDays: 9,
    });

    const july = calculateMedicalLeaveMonthAdjustment(
      [leave],
      dateOnly(2026, 7, 1),
      dateOnly(2026, 7, 31),
      DAILY_SALARY,
    );
    const august = calculateMedicalLeaveMonthAdjustment(
      [leave],
      dateOnly(2026, 8, 1),
      dateOnly(2026, 8, 31),
      DAILY_SALARY,
    );

    expect(july.medicalLeaveEmployerDays).toBe(2);
    expect(july.medicalLeaveEpsArlDays).toBe(2);
    expect(july.medicalLeaveOrdinaryDaysExcluded).toBe(2);

    expect(august.medicalLeaveEmployerDays).toBe(0);
    expect(august.medicalLeaveEpsArlDays).toBe(5);
    expect(august.medicalLeaveOrdinaryDaysExcluded).toBe(5);
  });

  it('applies 50% EPS rate for COMUN days 91 through 180', () => {
    const result = calculateMedicalLeaveMonthAdjustment(
      [
        makeLeave({
          startDate: dateOnly(2026, 1, 1),
          endDate: dateOnly(2026, 7, 4),
          totalDays: 185,
        }),
      ],
      dateOnly(2026, 4, 1),
      dateOnly(2026, 4, 1),
      DAILY_SALARY,
    );

    expect(result.medicalLeaveEpsArlDays).toBe(1);
    expect(result.medicalLeaveEpsArlPay).toBe(50_000);
    expect(result.medicalLeaveOrdinaryDaysExcluded).toBe(1);
  });

  it('excludes ordinary salary after day 180 without EPS pay', () => {
    const result = calculateMedicalLeaveMonthAdjustment(
      [
        makeLeave({
          startDate: dateOnly(2026, 1, 1),
          endDate: dateOnly(2026, 7, 10),
          totalDays: 191,
        }),
      ],
      dateOnly(2026, 7, 1),
      dateOnly(2026, 7, 1),
      DAILY_SALARY,
    );

    expect(result.medicalLeaveEpsArlDays).toBe(0);
    expect(result.medicalLeaveEpsArlPay).toBe(0);
    expect(result.medicalLeaveOrdinaryDaysExcluded).toBe(1);
  });
});
