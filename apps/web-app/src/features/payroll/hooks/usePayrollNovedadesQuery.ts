import { useQuery } from '@tanstack/react-query';

import { listPayrollNovedades } from '../api/payroll-novedades.client';
import { payrollKeys } from '../api/queryKeys';
import type { ListPayrollNovedadesFilters } from '../types/payroll-novedades.types';

export function usePayrollNovedadesQuery(filters: ListPayrollNovedadesFilters, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.payrollNovedadList(filters),
    queryFn: () => listPayrollNovedades(filters),
    enabled,
  });
}
