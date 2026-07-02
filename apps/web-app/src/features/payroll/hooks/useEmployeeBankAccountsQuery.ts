import { useQuery } from '@tanstack/react-query';

import { listEmployeeBankAccounts } from '../api/financial-profile.client';
import { payrollKeys } from '../api/queryKeys';

export function useEmployeeBankAccountsQuery(employeeId: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.bankAccounts(employeeId ?? ''),
    queryFn: () => listEmployeeBankAccounts(employeeId!),
    enabled: Boolean(employeeId),
    staleTime: 30_000,
  });
}
