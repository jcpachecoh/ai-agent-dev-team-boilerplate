import type { SupplierListFilters } from '../types';

export const proveedoresKeys = {
  all: ['proveedores'] as const,
  lists: () => [...proveedoresKeys.all, 'list'] as const,
  list: (filters: SupplierListFilters) => [...proveedoresKeys.lists(), filters] as const,
  details: () => [...proveedoresKeys.all, 'detail'] as const,
  detail: (id: string) => [...proveedoresKeys.details(), id] as const,
  products: (supplierId: string) => [...proveedoresKeys.detail(supplierId), 'products'] as const,
  supplyItems: (search: string) => [...proveedoresKeys.all, 'supply-items', search] as const,
};
