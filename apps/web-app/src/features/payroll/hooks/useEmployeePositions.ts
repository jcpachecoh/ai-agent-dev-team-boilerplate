import { useQuery } from '@tanstack/react-query';

import { listEmployeePositions } from '../api/employee-positions.api';
import { payrollKeys } from '../api/queryKeys';
import type { ListEmployeePositionsFilters } from '../types/employee-position.types';

export function useEmployeePositions(filters: ListEmployeePositionsFilters = {}) {
  return useQuery({
    queryKey: payrollKeys.positionList(filters),
    queryFn: () => listEmployeePositions(filters),
    staleTime: 5 * 60 * 1000,
  });
}
