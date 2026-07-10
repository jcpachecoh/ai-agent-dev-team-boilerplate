import { useQuery } from '@tanstack/react-query';

import { listEmployeeNovedadTypeConfigs } from '@/features/payroll/api/payroll-novedades.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';

export function useEmployeeNovedadTypeConfigQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.employeeNovedadTypeConfig(),
    queryFn: listEmployeeNovedadTypeConfigs,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
