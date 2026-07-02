import { useInfiniteQuery } from '@tanstack/react-query';

import { listEmployeePaymentHistory } from '../api/financial-profile.client';
import { payrollKeys } from '../api/queryKeys';

const DEFAULT_TAKE = 20;

export function useEmployeePaymentHistoryQuery(employeeId: string | undefined) {
  return useInfiniteQuery({
    queryKey: payrollKeys.paymentHistory(employeeId ?? ''),
    queryFn: ({ pageParam }) =>
      listEmployeePaymentHistory(employeeId!, {
        cursor: pageParam ?? null,
        take: DEFAULT_TAKE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
    enabled: Boolean(employeeId),
  });
}
