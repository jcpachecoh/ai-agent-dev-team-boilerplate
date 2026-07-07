import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplyItems } from '../api/proveedores.queries';
import { proveedoresKeys } from '../api/proveedores.keys';

export function useSupplyItems(search: string, enabled = true) {
  return useQuery({
    queryKey: proveedoresKeys.supplyItems(search),
    queryFn: () => fetchSupplyItems(search),
    enabled: isGraphqlConfigured() && enabled,
    staleTime: 60_000,
  });
}
