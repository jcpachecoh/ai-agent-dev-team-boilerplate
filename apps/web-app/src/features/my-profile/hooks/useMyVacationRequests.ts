import { useQuery } from '@tanstack/react-query';

import { listMyVacationRequests } from '@/features/payroll/api/vacations.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';
import type { VacationRequestsFilters } from '@/features/payroll/types/vacations.types';

export function useMyVacationRequests(
  employeeId: string | undefined,
  filters: VacationRequestsFilters = {},
) {
  const { employeeId: _ignored, ...myFilters } = filters;
  return useQuery({
    queryKey: payrollKeys.vacationRequests({ scope: 'me', ...myFilters }),
    queryFn: () => listMyVacationRequests(myFilters),
    enabled: !!employeeId,
  });
}
