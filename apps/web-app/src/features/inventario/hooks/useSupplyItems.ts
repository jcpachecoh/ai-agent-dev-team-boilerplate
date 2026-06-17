import { useQuery } from '@tanstack/react-query';

import { useInventoryMock } from '@/api/inventory/config';
import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplyItems } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';
import { toInventoryProduct } from '../mappers/toInventoryProduct';
import type { SupplyItemsListFilters } from '../types';

export type SupplyItemsScope = 'active' | 'all';

export function useSupplyItems(scope: SupplyItemsScope = 'active') {
  const filters: SupplyItemsListFilters = scope === 'active' ? { isActive: true } : {};

  return useQuery({
    queryKey: inventarioKeys.items(filters),
    queryFn: async () => {
      const items = await fetchSupplyItems(filters);
      return items.map(toInventoryProduct);
    },
    enabled: isGraphqlConfigured() || useInventoryMock(),
  });
}
