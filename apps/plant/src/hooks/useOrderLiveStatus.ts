import { useQuery } from '@tanstack/react-query';

import { fetchProductionOrderDetail } from '@/api/production-orders.api';
import { mapProductionOrderStatusToWorkstation } from '@/utils/mapProductionOrderToAvailable';

export function useOrderLiveStatus(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order-live-status', orderId],
    queryFn: () => fetchProductionOrderDetail(orderId!),
    enabled: Boolean(orderId),
    staleTime: 10_000,
    select: (detail) => mapProductionOrderStatusToWorkstation(detail.status),
  });
}
