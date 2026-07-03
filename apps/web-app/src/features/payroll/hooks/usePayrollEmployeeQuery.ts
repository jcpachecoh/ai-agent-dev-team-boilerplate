import { useQuery } from '@tanstack/react-query';

import { getPayrollEmployeeByUserId } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';

export function usePayrollEmployeeQuery(userId: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.employee(userId ?? ''),
    queryFn: () => getPayrollEmployeeByUserId(userId!),
    enabled: Boolean(userId),
  });
}
