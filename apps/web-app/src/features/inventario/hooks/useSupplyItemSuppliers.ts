import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplyItemSuppliers } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';

export function useSupplyItemSuppliers(id: string) {
  return useQuery({
    queryKey: inventarioKeys.suppliers(id),
    queryFn: () => fetchSupplyItemSuppliers(id),
    enabled: Boolean(id) && isGraphqlConfigured(),
  });
}
