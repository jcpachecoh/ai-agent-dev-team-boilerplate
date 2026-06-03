import { useQuery } from '@tanstack/react-query';

import { useInventoryMock } from '@/api/inventory/config';
import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplyCategories } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';

const MOCK_CATEGORIES = [
  { id: 'carnes', nombre: 'Carnes', isActive: true },
  { id: 'granos', nombre: 'Granos', isActive: true },
  { id: 'aceites', nombre: 'Aceites', isActive: true },
];

export type SupplyCategoriesScope = 'active' | 'all';

export function useSupplyCategories(scope: SupplyCategoriesScope = 'active') {
  const isActive = scope === 'active' ? true : undefined;

  return useQuery({
    queryKey: inventarioKeys.categories(scope),
    queryFn: async () => {
      if (useInventoryMock()) return MOCK_CATEGORIES;
      return fetchSupplyCategories(isActive);
    },
    enabled: isGraphqlConfigured() || useInventoryMock(),
  });
}
