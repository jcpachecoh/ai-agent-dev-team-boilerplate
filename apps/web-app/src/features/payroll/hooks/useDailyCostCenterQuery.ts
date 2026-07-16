import { useQuery } from '@tanstack/react-query';

import {
  getEmployeeDailyCostCenterCalendar,
  getPendingDailyCostCenterAssignments,
} from '../api/daily-cost-center.client';
import { payrollKeys } from '../api/queryKeys';

export function useEmployeeDailyCostCenterCalendarQuery(
  employeeId: string | undefined,
  from: string,
  to: string,
  enabled = true,
) {
  return useQuery({
    queryKey: payrollKeys.dailyCostCenterCalendar(employeeId ?? '', from, to),
    queryFn: () => getEmployeeDailyCostCenterCalendar(employeeId!, { from, to }),
    enabled: enabled && !!employeeId,
  });
}

export function usePendingDailyCostCenterAssignmentsQuery(from: string, to: string) {
  return useQuery({
    queryKey: payrollKeys.dailyCostCenterPending(from, to),
    queryFn: () => getPendingDailyCostCenterAssignments({ from, to }),
  });
}
