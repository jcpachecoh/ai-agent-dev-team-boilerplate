import { useQuery } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { fetchSuppliers } from '../api/proveedores.queries';
import { proveedoresKeys } from '../api/proveedores.keys';
import { mapSupplierToViewModel } from '../mappers/api';
import type { CondicionPagoFilter, SupplierListFilters, SupplierStatusFilter } from '../types';

function toListFilters(
  search: string,
  statusFilter: SupplierStatusFilter,
  paymentFilter: CondicionPagoFilter,
): SupplierListFilters {
  const filters: SupplierListFilters = {};

  const trimmed = search.trim();
  if (trimmed) filters.search = trimmed;

  if (statusFilter === 'active') filters.isActive = true;
  if (statusFilter === 'inactive') filters.isActive = false;

  if (paymentFilter !== 'all') {
    filters.condicionPago = paymentFilter;
  }

  return filters;
}

export function useSuppliers(
  search: string,
  statusFilter: SupplierStatusFilter,
  paymentFilter: CondicionPagoFilter,
) {
  const filters = toListFilters(search, statusFilter, paymentFilter);

  return useQuery({
    queryKey: proveedoresKeys.list(filters),
    queryFn: () => fetchSuppliers(filters),
    enabled: isGraphqlConfigured(),
    select: (rows) => rows.map(mapSupplierToViewModel),
  });
}

export function useSupplierListMetrics(
  search: string,
  statusFilter: SupplierStatusFilter,
  paymentFilter: CondicionPagoFilter,
) {
  const query = useSuppliers(search, statusFilter, paymentFilter);

  const metrics = {
    activeCount: 0,
    pendingCount: 0,
    totalBalanceCxp: 0,
    totalProducts: 0,
  };

  if (query.data) {
    metrics.activeCount = query.data.filter((s) => s.status === 'active').length;
    metrics.pendingCount = query.data.filter((s) => s.status === 'pending').length;
    metrics.totalProducts = query.data.reduce((sum, s) => sum + (s.productCount ?? 0), 0);
  }

  return { ...query, metrics };
}
