import { payrollFetch } from './payroll.client';
import type {
  EmployeeCalendarDay,
  ListAssignmentsRangeQuery,
  ManualAssignment,
  PendingAssignment,
} from '../types/daily-cost-center.types';

function toRangeQueryString(range: ListAssignmentsRangeQuery): string {
  const search = new URLSearchParams({ from: range.from, to: range.to });
  return `?${search.toString()}`;
}

export function getEmployeeDailyCostCenterCalendar(
  employeeId: string,
  range: ListAssignmentsRangeQuery,
): Promise<EmployeeCalendarDay[]> {
  return payrollFetch<EmployeeCalendarDay[]>(
    `/employees/${employeeId}/daily-cost-center-assignments${toRangeQueryString(range)}`,
  );
}

export function assignDailyCostCenterManual(
  employeeId: string,
  date: string,
  locationId: string,
): Promise<ManualAssignment> {
  return payrollFetch<ManualAssignment>(
    `/employees/${employeeId}/daily-cost-center-assignments/${date}`,
    {
      method: 'PUT',
      body: JSON.stringify({ locationId }),
    },
  );
}

export function getPendingDailyCostCenterAssignments(
  range: ListAssignmentsRangeQuery,
): Promise<PendingAssignment[]> {
  return payrollFetch<PendingAssignment[]>(
    `/daily-cost-center-assignments/pending${toRangeQueryString(range)}`,
  );
}

export function deleteDailyCostCenterManual(id: string): Promise<void> {
  return payrollFetch<void>(`/daily-cost-center-assignments/${id}`, { method: 'DELETE' });
}
