import { useQuery } from '@tanstack/react-query';

import { listNovedadTypeConfigs } from '../api/payroll-novedades.client';
import { payrollKeys } from '../api/queryKeys';

export function useNovedadTypeConfigQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.novedadTypeConfig(),
    queryFn: listNovedadTypeConfigs,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
