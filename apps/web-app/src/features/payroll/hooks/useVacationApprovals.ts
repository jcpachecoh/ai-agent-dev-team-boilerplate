import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { listVacationRequests } from '@/features/payroll/api/vacations.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';
import type {
  VacationRequestsFilters,
  VacationStatus,
} from '@/features/payroll/types/vacations.types';
import {
  currentVacationMonth,
  monthToIsoDateRange,
} from '@/features/payroll/utils/vacation-display.utils';

export interface VacationApprovalFilters {
  locationId: string;
  status: VacationStatus | 'all';
  /** Mes en formato YYYY-MM */
  month: string;
}

export function useVacationApprovals(initial?: Partial<VacationApprovalFilters>) {
  const defaultMonth = currentVacationMonth();
  const [filters, setFilters] = useState<VacationApprovalFilters>({
    locationId: initial?.locationId ?? '',
    status: initial?.status ?? 'all',
    month: initial?.month ?? defaultMonth,
  });

  const queryFilters = useMemo<VacationRequestsFilters>(() => {
    const next: VacationRequestsFilters = { take: 50 };
    if (filters.locationId) next.locationId = filters.locationId;
    if (filters.status !== 'all') next.status = filters.status;

    const { dateFrom, dateTo } = monthToIsoDateRange(filters.month);
    if (dateFrom) next.dateFrom = dateFrom;
    if (dateTo) next.dateTo = dateTo;

    return next;
  }, [filters]);

  const query = useQuery({
    queryKey: payrollKeys.vacationRequests(queryFilters as Record<string, unknown>),
    queryFn: () => listVacationRequests(queryFilters),
  });

  return {
    filters,
    setFilters,
    query,
    requests: query.data ?? [],
  };
}
