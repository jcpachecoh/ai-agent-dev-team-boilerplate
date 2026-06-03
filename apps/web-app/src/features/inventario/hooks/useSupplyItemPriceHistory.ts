import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplyItemPriceHistory } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';

export function useSupplyItemPriceHistory(id: string) {
  return useQuery({
    queryKey: inventarioKeys.priceHistory(id),
    queryFn: () => fetchSupplyItemPriceHistory(id),
    enabled: Boolean(id) && isGraphqlConfigured(),
  });
}
