import { useQuery } from '@tanstack/react-query';

import { useInventoryMock } from '@/api/inventory/config';
import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplyCategories } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';
import type { SupplyCategoryApi } from '../types';

const MOCK_CATEGORIES: SupplyCategoryApi[] = [
  { id: 'carnes', nombre: 'Carnes', prefijo: 'CAR', isActive: true },
  { id: 'granos', nombre: 'Granos', prefijo: 'GRA', isActive: true },
  { id: 'aceites', nombre: 'Aceites', prefijo: 'ACE', isActive: true },
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
