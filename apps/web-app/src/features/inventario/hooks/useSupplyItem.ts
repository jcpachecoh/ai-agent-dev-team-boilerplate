import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplyItem } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';
import { toInventoryProduct } from '../mappers/toInventoryProduct';

export function useSupplyItem(id: string) {
  return useQuery({
    queryKey: inventarioKeys.item(id),
    queryFn: async () => {
      const item = await fetchSupplyItem(id);
      return item ? toInventoryProduct(item) : undefined;
    },
    enabled: Boolean(id) && isGraphqlConfigured(),
  });
}
