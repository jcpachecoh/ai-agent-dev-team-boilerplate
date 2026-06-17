import { inventoryFetch } from '@/api/inventory/client';
import type {
  InventoryAlert,
  InventoryDashboardData,
  InventoryReportData,
} from '@/types/inventory';

import type {
  CreateSupplyItemInput,
  PriceHistoryEntryApi,
  SupplyCategoryApi,
  SupplyItemApi,
  SupplyItemSupplierApi,
  SupplyItemsListFilters,
  UpdateSupplyItemInput,
} from '../types';

function buildQuery(filters: SupplyItemsListFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.categoriaId) params.set('categoriaId', filters.categoriaId);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function fetchSupplyCategories(isActive?: boolean): Promise<SupplyCategoryApi[]> {
  const qs = isActive === undefined ? '' : `?isActive=${isActive}`;
  return inventoryFetch<SupplyCategoryApi[]>(`/supply-categories${qs}`);
}

export function createSupplyCategory(input: {
  nombre: string;
  prefijo: string;
  descripcion?: string;
}): Promise<SupplyCategoryApi> {
  return inventoryFetch<SupplyCategoryApi>('/supply-categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSupplyCategory(
  id: string,
  input: { nombre?: string; prefijo?: string; descripcion?: string; isActive?: boolean },
): Promise<SupplyCategoryApi> {
  return inventoryFetch<SupplyCategoryApi>(`/supply-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function fetchNextSupplyItemCodigo(categoriaId: string): Promise<string> {
  return inventoryFetch<{ codigoInterno: string }>(
    `/supply-categories/${categoriaId}/next-codigo`,
  ).then((res) => res.codigoInterno);
}

export function fetchSupplyItems(filters: SupplyItemsListFilters = {}): Promise<SupplyItemApi[]> {
  return inventoryFetch<SupplyItemApi[]>(`/supply-items${buildQuery(filters)}`);
}

export function fetchSupplyItem(id: string): Promise<SupplyItemApi> {
  return inventoryFetch<SupplyItemApi>(`/supply-items/${id}`);
}

export function createSupplyItem(input: CreateSupplyItemInput): Promise<SupplyItemApi> {
  return inventoryFetch<SupplyItemApi>('/supply-items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSupplyItem(id: string, input: UpdateSupplyItemInput): Promise<SupplyItemApi> {
  return inventoryFetch<SupplyItemApi>(`/supply-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deactivateSupplyItem(id: string): Promise<SupplyItemApi> {
  return inventoryFetch<SupplyItemApi>(`/supply-items/${id}`, { method: 'DELETE' });
}

export async function checkCodigoInternoExists(
  codigoInterno: string,
  excludeId?: string,
): Promise<boolean> {
  const items = await fetchSupplyItems({ search: codigoInterno });
  return items.some(
    (item) =>
      item.codigoInterno.toLowerCase() === codigoInterno.toLowerCase() && item.id !== excludeId,
  );
}

export function fetchSupplyItemSuppliers(id: string): Promise<SupplyItemSupplierApi[]> {
  return inventoryFetch<SupplyItemSupplierApi[]>(`/supply-items/${id}/suppliers`);
}

export function fetchSupplyItemPriceHistory(id: string): Promise<PriceHistoryEntryApi[]> {
  return inventoryFetch<PriceHistoryEntryApi[]>(`/supply-items/${id}/price-history`);
}

export function fetchInventoryDashboardApi(): Promise<InventoryDashboardData> {
  return inventoryFetch<InventoryDashboardData>('/inventory/dashboard');
}

export function fetchInventoryAlertsApi(): Promise<InventoryAlert[]> {
  return inventoryFetch<InventoryAlert[]>('/inventory/alerts');
}

export function fetchInventoryAlertSummaryApi(): Promise<{
  critical: number;
  warning: number;
  resolvedToday: number;
}> {
  return inventoryFetch('/inventory/alerts/summary');
}

export function resolveInventoryAlertApi(id: string): Promise<void> {
  return inventoryFetch(`/inventory/alerts/${id}/resolve`, { method: 'PATCH' });
}

export function fetchInventoryReportApi(
  type: string,
  _from: string,
  _to: string,
): Promise<InventoryReportData> {
  return inventoryFetch<InventoryReportData>(`/inventory/reports?type=${type}`);
}
