import { useQuery } from '@tanstack/react-query';

import { listPayrollEmployees } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type { PayrollEmployeesFilters } from '../types/payroll.types';

export function usePayrollEmployeesQuery(filters: PayrollEmployeesFilters) {
  return useQuery({
    queryKey: payrollKeys.employeeList(filters),
    queryFn: () => listPayrollEmployees(filters),
  });
}
