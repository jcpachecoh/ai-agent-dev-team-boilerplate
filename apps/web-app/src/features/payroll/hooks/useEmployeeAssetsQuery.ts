import { useQuery } from '@tanstack/react-query';

import { fetchEmployeeAssets } from '../api/employee-assets.graphql';
import { payrollKeys } from '../api/queryKeys';

export function useEmployeeAssetsQuery(employeeId: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.assets(employeeId ?? ''),
    queryFn: () => fetchEmployeeAssets(employeeId!),
    enabled: !!employeeId,
  });
}
