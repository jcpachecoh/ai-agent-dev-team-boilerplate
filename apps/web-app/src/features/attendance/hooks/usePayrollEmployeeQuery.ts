import { useQuery } from '@tanstack/react-query';

import { getPayrollEmployeeByUserId } from '@/features/payroll/api/payroll.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';

export function usePayrollEmployeeQuery(userId: string) {
  return useQuery({
    queryKey: payrollKeys.employee(userId),
    queryFn: () => getPayrollEmployeeByUserId(userId),
    enabled: Boolean(userId),
  });
}
