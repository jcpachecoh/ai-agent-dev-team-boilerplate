import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchMarcacionesPorEmpleado } from '../api/mobile-attendance.client';
import { payrollKeys } from '../api/queryKeys';
import type { EmployeeMarcacionesFilters } from '../types/mobile-attendance.types';

const DEFAULT_TAKE = 20;

export function useEmployeeMarcacionesQuery(
  employeeId: string | undefined,
  filters: EmployeeMarcacionesFilters,
) {
  const take = filters.take ?? DEFAULT_TAKE;

  return useInfiniteQuery({
    queryKey: payrollKeys.employeeMarcaciones(employeeId ?? '', {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      status: filters.status ?? null,
      take,
    }),
    queryFn: ({ pageParam }) =>
      fetchMarcacionesPorEmpleado({
        employeeId: employeeId!,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: filters.status ?? null,
        cursor: pageParam ?? null,
        take,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
    enabled: Boolean(employeeId && filters.dateFrom && filters.dateTo),
  });
}
