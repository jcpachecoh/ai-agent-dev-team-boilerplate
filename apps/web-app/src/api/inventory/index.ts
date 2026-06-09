import {
  checkCodigoInternoExists,
  createSupplyItem,
  deactivateSupplyItem,
  fetchSupplyItem,
  fetchSupplyItemPriceHistory,
  fetchSupplyItemSuppliers,
  fetchSupplyItems,
  updateSupplyItem,
} from '@/features/inventario/api/inventario.api';
import { toInventoryProduct } from '@/features/inventario/mappers/toInventoryProduct';
import {
  formValuesToCreateInput,
  formValuesToUpdateInput,
} from '@/features/inventario/mappers/formValues';
import { inventoryMockStore } from '@/mocks/inventory/store';
import type {
  InventoryAlert,
  InventoryDashboardData,
  InventoryMovement,
  InventoryProduct,
  InventoryProductFormValues,
  InventoryReportData,
  InventoryStockBySite,
} from '@/types/inventory';

import {
  fetchInventoryAlertSummaryApi,
  fetchInventoryAlertsApi,
  fetchInventoryDashboardApi,
  fetchInventoryReportApi,
} from '@/features/inventario/api/inventario.rest';
import { inventoryFetch } from './client';
import { useInventoryMock, useInventoryMovementsMock } from './config';

type AlertSummary = { critical: number; warning: number; resolvedToday: number };

let cachedAlertSummary: AlertSummary | null = null;

export async function fetchInventoryProducts(): Promise<InventoryProduct[]> {
  if (useInventoryMock()) return inventoryMockStore.listProducts();
  const items = await fetchSupplyItems();
  return items.map(toInventoryProduct);
}

export async function fetchInventoryProduct(id: string): Promise<InventoryProduct | undefined> {
  if (useInventoryMock()) return inventoryMockStore.getProduct(id);
  const item = await fetchSupplyItem(id);
  return item ? toInventoryProduct(item) : undefined;
}

export async function createInventoryProduct(
  values: InventoryProductFormValues,
): Promise<InventoryProduct> {
  if (useInventoryMock()) return inventoryMockStore.createProduct(values);
  const item = await createSupplyItem(formValuesToCreateInput(values));
  return toInventoryProduct(item);
}

export async function updateInventoryProduct(
  id: string,
  values: InventoryProductFormValues,
): Promise<InventoryProduct> {
  if (useInventoryMock()) return inventoryMockStore.updateProduct(id, values);
  const item = await updateSupplyItem(id, formValuesToUpdateInput(values));
  return toInventoryProduct(item);
}

export async function deleteInventoryProduct(id: string): Promise<void> {
  if (useInventoryMock()) return inventoryMockStore.deleteProduct(id);
  await deactivateSupplyItem(id);
}

export async function checkSkuExists(sku: string, excludeId?: string): Promise<boolean> {
  if (useInventoryMock()) return inventoryMockStore.skuExists(sku, excludeId);
  return checkCodigoInternoExists(sku, excludeId);
}

export { fetchSupplyItemSuppliers, fetchSupplyItemPriceHistory };

export async function fetchInventoryDashboard(): Promise<InventoryDashboardData> {
  if (useInventoryMock()) return inventoryMockStore.getDashboard();
  return fetchInventoryDashboardApi();
}

export async function fetchInventoryMovements(): Promise<InventoryMovement[]> {
  if (useInventoryMock() || useInventoryMovementsMock()) {
    return inventoryMockStore.listMovements();
  }
  return inventoryFetch<InventoryMovement[]>('/inventory/movements');
}

export async function fetchInventoryAlerts(): Promise<InventoryAlert[]> {
  if (useInventoryMock()) return inventoryMockStore.listAlerts();
  const [list, summary] = await Promise.all([
    fetchInventoryAlertsApi(),
    fetchInventoryAlertSummaryApi(),
  ]);
  cachedAlertSummary = summary;
  return list;
}

export async function resolveInventoryAlert(id: string): Promise<void> {
  if (useInventoryMock()) return inventoryMockStore.resolveAlert(id);
  await inventoryFetch(`/inventory/alerts/${id}/resolve`, { method: 'PATCH' });
}

export function fetchInventoryAlertSummary(): AlertSummary {
  if (useInventoryMock()) return inventoryMockStore.getAlertSummary();
  return cachedAlertSummary ?? { critical: 0, warning: 0, resolvedToday: 0 };
}

export async function fetchStockBySite(productId: string): Promise<InventoryStockBySite[]> {
  if (useInventoryMock() || useInventoryMovementsMock()) {
    return inventoryMockStore.getStockBySite(productId);
  }
  return inventoryFetch<InventoryStockBySite[]>(`/inventory/products/${productId}/stock-by-site`);
}

export async function fetchProductMovements(productId: string): Promise<InventoryMovement[]> {
  if (useInventoryMock() || useInventoryMovementsMock()) {
    return inventoryMockStore.getProductMovements(productId);
  }
  return inventoryFetch<InventoryMovement[]>(`/inventory/products/${productId}/movements`);
}

export async function adjustProductStock(
  productId: string,
  quantity: number,
  reason: string,
): Promise<void> {
  if (useInventoryMock() || useInventoryMovementsMock()) {
    return inventoryMockStore.adjustStock(productId, quantity, reason);
  }
  await inventoryFetch(`/inventory/products/${productId}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ quantity, reason }),
  });
}

export async function fetchInventoryReport(
  type: string,
  from: string,
  to: string,
): Promise<InventoryReportData> {
  if (useInventoryMock()) return inventoryMockStore.getReport(type, from, to);
  return fetchInventoryReportApi(type, from, to);
}
