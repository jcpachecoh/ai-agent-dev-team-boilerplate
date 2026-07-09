import { useQuery } from '@tanstack/react-query';

import { useMe } from '@/features/auth/hooks/useMe';
import { payrollKeys } from '@/features/payroll/api/queryKeys';
import { getMyPayrollEmployee } from '@/features/payroll/api/payroll.client';
import { getMyVacationBalance } from '@/features/payroll/api/vacations.client';

export function useMyEmployee() {
  const { data: me } = useMe();
  const employeeQuery = useQuery({
    queryKey: payrollKeys.employee('me'),
    queryFn: () => getMyPayrollEmployee(),
    enabled: Boolean(me?.id),
  });
  return {
    userId: me?.id,
    employeeId: employeeQuery.data?.id,
    employee: employeeQuery.data,
    isLoading: employeeQuery.isLoading,
    isError: employeeQuery.isError,
    error: employeeQuery.error,
    refetch: employeeQuery.refetch,
  };
}

export function useMyVacationBalance(employeeId: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.vacationBalance(employeeId ?? 'me'),
    queryFn: () => getMyVacationBalance(),
    enabled: !!employeeId,
  });
}
