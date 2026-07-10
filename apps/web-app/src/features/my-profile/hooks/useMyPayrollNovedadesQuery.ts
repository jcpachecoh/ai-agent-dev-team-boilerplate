import { useQuery } from '@tanstack/react-query';

import { listMyPayrollNovedades } from '@/features/payroll/api/payroll-novedades.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';
import type { ListMyPayrollNovedadesFilters } from '@/features/payroll/types/payroll-novedades.types';

export function useMyPayrollNovedadesQuery(
  filters: ListMyPayrollNovedadesFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: payrollKeys.myPayrollNovedades(filters),
    queryFn: () => listMyPayrollNovedades(filters),
    enabled,
  });
}
