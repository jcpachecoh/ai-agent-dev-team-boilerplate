import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchOrderRecipeView, type OrderRecipeViewResponse } from '@/api/operator-order.api';
import {
  mapOrderRecipeViewToPlantRecipe,
  mapOrderStatusToWorkstationStatus,
} from '@/utils/mapOrderRecipeView';

export function orderRecipeQueryKey(orderId: string): readonly ['order-recipe', string] {
  return ['order-recipe', orderId];
}

export function fetchFreshOrderRecipeView(
  queryClient: QueryClient,
  orderId: string,
): Promise<OrderRecipeViewResponse> {
  return queryClient.fetchQuery({
    queryKey: orderRecipeQueryKey(orderId),
    queryFn: () => fetchOrderRecipeView(orderId),
  });
}

export function useOrderRecipe(orderId: string | undefined) {
  const query = useQuery({
    queryKey: orderId ? orderRecipeQueryKey(orderId) : ['order-recipe', ''],
    queryFn: () => fetchOrderRecipeView(orderId!),
    enabled: Boolean(orderId),
    staleTime: 0,
  });

  const view = query.data;

  const recipe = useMemo(() => (view ? mapOrderRecipeViewToPlantRecipe(view) : undefined), [view]);

  return {
    ...query,
    recipe,
    productName: view?.productName,
    currentPhaseIndex: view?.currentPhaseIndex ?? 1,
    status: view ? mapOrderStatusToWorkstationStatus(view.status) : undefined,
    elapsedSeconds: view?.elapsedSeconds ?? 0,
    currentStepId: view?.currentStepId,
    stationId: view?.stationId,
  };
}
