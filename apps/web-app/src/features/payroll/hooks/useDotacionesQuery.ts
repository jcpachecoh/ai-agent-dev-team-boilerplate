import { useQuery } from '@tanstack/react-query';

import {
  fetchAvailableItemsForDotacion,
  fetchDotacionPeriod,
  fetchEmployeeDotacionHistory,
} from '../api/dotaciones.graphql';
import { payrollKeys } from '../api/queryKeys';

export function useDotacionPeriodQuery(period: string, locationId?: string, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.dotacionPeriod(period, locationId),
    queryFn: () => fetchDotacionPeriod(period, locationId),
    enabled: enabled && !!period,
  });
}

export function useAvailableItemsForDotacionQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.dotacionAvailableItems(),
    queryFn: fetchAvailableItemsForDotacion,
    enabled,
    staleTime: 60_000,
  });
}

export function useEmployeeDotacionHistoryQuery(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.dotacionEmployeeHistory(employeeId ?? ''),
    queryFn: () => fetchEmployeeDotacionHistory(employeeId!),
    enabled: enabled && !!employeeId,
  });
}
