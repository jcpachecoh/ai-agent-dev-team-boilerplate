import { workDateFromIso } from '../../attendance/utils/period-range.util';

/** Período de nómina YYYY-MM desde workDate normalizado (UTC midnight = día Colombia). */
export function formatPayrollPeriod(workDate: Date): string {
  const year = workDate.getUTCFullYear();
  const month = String(workDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function payrollPeriodToWorkDateRange(payrollPeriod: string): {
  workDateFrom: Date;
  workDateTo: Date;
} {
  const [yearStr, monthStr] = payrollPeriod.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    workDateFrom: workDateFromIso(`${yearStr}-${monthStr}-01`),
    workDateTo: workDateFromIso(`${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`),
  };
}

export function payrollPeriodFromYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
