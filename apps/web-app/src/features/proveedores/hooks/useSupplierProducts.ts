import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSupplierProducts } from '../api/proveedores.queries';
import { proveedoresKeys } from '../api/proveedores.keys';
import { mapSupplierProductToCatalogRow } from '../mappers/api';

export function useSupplierProducts(supplierId: string | undefined) {
  return useQuery({
    queryKey: proveedoresKeys.products(supplierId ?? ''),
    queryFn: () => fetchSupplierProducts(supplierId!),
    enabled: isGraphqlConfigured() && Boolean(supplierId),
    select: (rows) => rows.map(mapSupplierProductToCatalogRow),
  });
}
