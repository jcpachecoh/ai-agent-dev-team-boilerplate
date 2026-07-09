import { useQuery } from '@tanstack/react-query';

import { listAllPayrollEmployees } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';

const ACTIVE_EMPLOYEES_FILTERS = { isActive: true } as const;

export function useActivePayrollEmployeesQuery() {
  return useQuery({
    queryKey: [...payrollKeys.employees(), 'all-pages', ACTIVE_EMPLOYEES_FILTERS],
    queryFn: () => listAllPayrollEmployees(ACTIVE_EMPLOYEES_FILTERS),
  });
}
