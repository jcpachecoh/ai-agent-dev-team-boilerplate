import { LeaveOrigin } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import type { PaymentSplitResult } from '../interfaces/medical-leaves.interfaces';

const EPS_RATE_HIGH = new Decimal('0.6667');
const EPS_RATE_LOW = new Decimal('0.5');
const DAYS_PER_MONTH = new Decimal(30);

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function calculateInclusiveCalendarDays(from: Date, to: Date): number {
  const startMs = startOfDay(from).getTime();
  const endMs = startOfDay(to).getTime();
  if (startMs > endMs) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((endMs - startMs) / dayMs) + 1;
}

export function resolveDailySalary(salaryAmount: Decimal): Decimal {
  return salaryAmount.div(DAYS_PER_MONTH).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function roundHalfUp(value: Decimal, decimals: number): Decimal {
  return value.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}

export function calculatePaymentSplit(
  origin: LeaveOrigin,
  startDate: Date,
  endDate: Date,
  dailySalary: Decimal,
): PaymentSplitResult {
  const totalDays = calculateInclusiveCalendarDays(startDate, endDate);

  if (totalDays <= 0) {
    return {
      totalDays: 0,
      employerPaidDays: 0,
      epsArlPaidDays: 0,
      employerAmount: new Decimal(0),
      epsArlAmount: new Decimal(0),
    };
  }

  if (origin === LeaveOrigin.LABORAL) {
    return {
      totalDays,
      employerPaidDays: 0,
      epsArlPaidDays: totalDays,
      employerAmount: new Decimal(0),
      epsArlAmount: roundHalfUp(dailySalary.mul(totalDays), 2),
    };
  }

  let employerPaidDays = 0;
  let epsArlPaidDays = 0;
  let employerAmount = new Decimal(0);
  let epsArlAmount = new Decimal(0);
  const warnings: string[] = [];

  for (let day = 1; day <= totalDays; day += 1) {
    if (day <= 2) {
      employerPaidDays += 1;
      employerAmount = employerAmount.add(dailySalary);
      continue;
    }

    if (day <= 90) {
      epsArlPaidDays += 1;
      epsArlAmount = epsArlAmount.add(roundHalfUp(dailySalary.mul(EPS_RATE_HIGH), 2));
      continue;
    }

    if (day <= 180) {
      epsArlPaidDays += 1;
      epsArlAmount = epsArlAmount.add(roundHalfUp(dailySalary.mul(EPS_RATE_LOW), 2));
      continue;
    }

    warnings.push(`Día ${day} del evento supera el límite de 180 días; no asignado a EPS en MVP.`);
  }

  if (totalDays > 180) {
    warnings.push('El evento supera los 180 días de incapacidad; revisión legal requerida.');
  }

  return {
    totalDays,
    employerPaidDays,
    epsArlPaidDays,
    employerAmount: roundHalfUp(employerAmount, 2),
    epsArlAmount: roundHalfUp(epsArlAmount, 2),
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
