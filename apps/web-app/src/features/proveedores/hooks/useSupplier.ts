import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplier } from '../api/proveedores.queries';
import { proveedoresKeys } from '../api/proveedores.keys';
import { mapSupplierToViewModel } from '../mappers/api';

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: proveedoresKeys.detail(id ?? ''),
    queryFn: () => fetchSupplier(id!),
    enabled: Boolean(id) && isGraphqlConfigured(),
    select: (supplier) => (supplier ? mapSupplierToViewModel(supplier) : null),
  });
}
