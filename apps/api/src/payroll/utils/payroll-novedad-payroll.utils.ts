import type { PayrollNovedadPayrollPeriodRange } from '../../payroll-novedades/interfaces/payroll-novedades.interfaces';

export interface PayrollNovedadMonthAdjustment {
  payrollNovedadUnpaidDays: number;
  payrollNovedadUnpaidDeduction: number;
  payrollNovedadPaidDays: number;
}

function roundCOP(value: number): number {
  return Math.round(value);
}

function eachDayInMonthRange(
  periodStart: Date,
  periodEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const start = new Date(Math.max(periodStart.getTime(), rangeStart.getTime()));
  const end = new Date(Math.min(periodEnd.getTime(), rangeEnd.getTime()));
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function calculatePayrollNovedadMonthAdjustment(
  novedades: PayrollNovedadPayrollPeriodRange[],
  periodStart: Date,
  periodEnd: Date,
  dailySalary: number,
): PayrollNovedadMonthAdjustment {
  let payrollNovedadUnpaidDays = 0;
  let payrollNovedadPaidDays = 0;

  for (const novedad of novedades) {
    const days = eachDayInMonthRange(periodStart, periodEnd, novedad.startDate, novedad.endDate);
    for (const _day of days) {
      if (novedad.isPaid) {
        payrollNovedadPaidDays += 1;
      } else {
        payrollNovedadUnpaidDays += 1;
      }
    }
  }

  return {
    payrollNovedadUnpaidDays,
    payrollNovedadUnpaidDeduction: roundCOP(dailySalary * payrollNovedadUnpaidDays),
    payrollNovedadPaidDays,
  };
}
