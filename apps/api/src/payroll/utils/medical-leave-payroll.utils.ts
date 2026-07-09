import { LeaveOrigin } from '@prisma/client';

import type { MedicalLeavePayrollPeriodRange } from '../../medical-leaves/interfaces/medical-leaves.interfaces';

const EPS_RATE_HIGH = 0.6667;
const EPS_RATE_LOW = 0.5;

export interface MedicalLeaveMonthPayrollAdjustment {
  medicalLeaveEmployerDays: number;
  medicalLeaveEmployerPay: number;
  medicalLeaveEpsArlDays: number;
  medicalLeaveEpsArlPay: number;
  medicalLeaveOrdinaryDaysExcluded: number;
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function eachCalendarDayInRange(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const current = startOfDay(from);
  const end = startOfDay(to);

  while (current.getTime() <= end.getTime()) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function ordinalDayInLeave(leaveStart: Date, day: Date): number {
  const startMs = startOfDay(leaveStart).getTime();
  const dayMs = startOfDay(day).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.floor((dayMs - startMs) / oneDayMs) + 1;
}

function roundCOP(value: number): number {
  return Math.round(value);
}

/**
 * Prorratea incapacidades activas que intersectan un mes calendario (epic D3).
 * Aplica split por día ordinal del evento (reutiliza reglas task 04).
 */
export function calculateMedicalLeaveMonthAdjustment(
  leaves: MedicalLeavePayrollPeriodRange[],
  periodStart: Date,
  periodEnd: Date,
  dailySalary: number,
): MedicalLeaveMonthPayrollAdjustment {
  let medicalLeaveEmployerDays = 0;
  let medicalLeaveEmployerPay = 0;
  let medicalLeaveEpsArlDays = 0;
  let medicalLeaveEpsArlPay = 0;
  let medicalLeaveOrdinaryDaysExcluded = 0;

  const monthDays = eachCalendarDayInRange(periodStart, periodEnd);

  for (const leave of leaves) {
    const leaveStart = startOfDay(leave.startDate);
    const leaveEnd = startOfDay(leave.endDate);

    for (const day of monthDays) {
      if (day < leaveStart || day > leaveEnd) {
        continue;
      }

      const ordinal = ordinalDayInLeave(leave.startDate, day);

      if (leave.origin === LeaveOrigin.LABORAL) {
        medicalLeaveEpsArlDays += 1;
        medicalLeaveEpsArlPay += roundCOP(dailySalary);
        medicalLeaveOrdinaryDaysExcluded += 1;
        continue;
      }

      if (ordinal <= 2) {
        medicalLeaveEmployerDays += 1;
        medicalLeaveEmployerPay += roundCOP(dailySalary);
        continue;
      }

      if (ordinal <= 90) {
        medicalLeaveEpsArlDays += 1;
        medicalLeaveEpsArlPay += roundCOP(dailySalary * EPS_RATE_HIGH);
        medicalLeaveOrdinaryDaysExcluded += 1;
        continue;
      }

      if (ordinal <= 180) {
        medicalLeaveEpsArlDays += 1;
        medicalLeaveEpsArlPay += roundCOP(dailySalary * EPS_RATE_LOW);
        medicalLeaveOrdinaryDaysExcluded += 1;
        continue;
      }

      medicalLeaveOrdinaryDaysExcluded += 1;
    }
  }

  return {
    medicalLeaveEmployerDays,
    medicalLeaveEmployerPay,
    medicalLeaveEpsArlDays,
    medicalLeaveEpsArlPay,
    medicalLeaveOrdinaryDaysExcluded,
  };
}
