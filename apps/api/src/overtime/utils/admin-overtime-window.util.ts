import { formatPayrollPeriod } from './overtime-period.util';
import { getBogotaDateParts } from '../../attendance/utils/period-range.util';

/** Integer minutes from absolute instants (floor). */
export function calculateProposedMinutes(proposedStartTime: Date, proposedEndTime: Date): number {
  return Math.floor((proposedEndTime.getTime() - proposedStartTime.getTime()) / 60_000);
}

/** YYYY-MM-DD for a Date stored as UTC midnight work day. */
export function workDateToIso(workDate: Date): string {
  const year = workDate.getUTCFullYear();
  const month = String(workDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(workDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** True when proposedStart (America/Bogota calendar day) matches workDate DATE. */
export function isProposedStartOnWorkDate(workDate: Date, proposedStartTime: Date): boolean {
  const start = getBogotaDateParts(proposedStartTime);
  return (
    start.year === workDate.getUTCFullYear() &&
    start.month === workDate.getUTCMonth() + 1 &&
    start.day === workDate.getUTCDate()
  );
}

export function derivePayrollPeriodFromWorkDate(workDate: Date): string {
  return formatPayrollPeriod(workDate);
}
