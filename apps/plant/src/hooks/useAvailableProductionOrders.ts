import type { PlantAvailableOrder } from '@restopsiq/ui';
import { useQuery } from '@tanstack/react-query';

import { fetchAssignableOrdersWithDetail } from '@/api/production-orders.api';
import {
  mapProductionOrderDetailToAvailable,
  mapProductionOrderListItemToAvailable,
} from '@/utils/mapProductionOrderToAvailable';

export const availableProductionOrdersQueryKey = ['plant', 'available-production-orders'] as const;

async function loadAvailableProductionOrders(): Promise<PlantAvailableOrder[]> {
  const rows = await fetchAssignableOrdersWithDetail();

  return rows.map((row) =>
    row.detail
      ? mapProductionOrderDetailToAvailable(row.listItem, row.detail, row.workstationCodeById)
      : mapProductionOrderListItemToAvailable(row.listItem),
  );
}

export function useAvailableProductionOrders(enabled = true) {
  return useQuery({
    queryKey: availableProductionOrdersQueryKey,
    queryFn: loadAvailableProductionOrders,
    enabled,
    staleTime: 15_000,
  });
}
