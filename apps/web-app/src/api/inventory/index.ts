import type {
  InventoryAlert,
  InventoryDashboardData,
  InventoryMovement,
  InventoryProduct,
  InventoryProductFormValues,
  InventoryReportData,
  InventoryStockBySite,
} from '@/types/inventory';
import { inventoryMockStore } from '@/mocks/inventory/store';

import { useInventoryMock } from './config';
import { inventoryFetch } from './client';

export async function fetchInventoryProducts(): Promise<InventoryProduct[]> {
  if (useInventoryMock()) return inventoryMockStore.listProducts();
  return inventoryFetch<InventoryProduct[]>('/supply-items');
}

export async function fetchInventoryProduct(id: string): Promise<InventoryProduct | undefined> {
  if (useInventoryMock()) return inventoryMockStore.getProduct(id);
  try {
    return await inventoryFetch<InventoryProduct>(`/supply-items/${id}`);
  } catch {
    return undefined;
  }
}

export async function createInventoryProduct(
  values: InventoryProductFormValues,
): Promise<InventoryProduct> {
  if (useInventoryMock()) return inventoryMockStore.createProduct(values);
  return inventoryFetch<InventoryProduct>('/supply-items', {
    method: 'POST',
    body: JSON.stringify(mapFormToApi(values)),
  });
}

export async function updateInventoryProduct(
  id: string,
  values: InventoryProductFormValues,
): Promise<InventoryProduct> {
  if (useInventoryMock()) return inventoryMockStore.updateProduct(id, values);
  return inventoryFetch<InventoryProduct>(`/supply-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapFormToApi(values)),
  });
}

export async function deleteInventoryProduct(id: string): Promise<void> {
  if (useInventoryMock()) return inventoryMockStore.deleteProduct(id);
  await inventoryFetch(`/supply-items/${id}`, { method: 'DELETE' });
}

export async function checkSkuExists(sku: string, excludeId?: string): Promise<boolean> {
  if (useInventoryMock()) return inventoryMockStore.skuExists(sku, excludeId);
  const items = await fetchInventoryProducts();
  return items.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== excludeId);
}

export async function fetchInventoryDashboard(): Promise<InventoryDashboardData> {
  if (useInventoryMock()) return inventoryMockStore.getDashboard();
  return inventoryFetch<InventoryDashboardData>('/inventory/dashboard');
}

export async function fetchInventoryMovements(): Promise<InventoryMovement[]> {
  if (useInventoryMock()) return inventoryMockStore.listMovements();
  return inventoryFetch<InventoryMovement[]>('/inventory/movements');
}

export async function fetchInventoryAlerts(): Promise<InventoryAlert[]> {
  if (useInventoryMock()) return inventoryMockStore.listAlerts();
  return inventoryFetch<InventoryAlert[]>('/inventory/alerts');
}

export async function resolveInventoryAlert(id: string): Promise<void> {
  if (useInventoryMock()) return inventoryMockStore.resolveAlert(id);
  await inventoryFetch(`/inventory/alerts/${id}/resolve`, { method: 'PATCH' });
}

export function fetchInventoryAlertSummary() {
  if (useInventoryMock()) return inventoryMockStore.getAlertSummary();
  return { critical: 0, warning: 0, resolvedToday: 0 };
}

export async function fetchStockBySite(productId: string): Promise<InventoryStockBySite[]> {
  if (useInventoryMock()) return inventoryMockStore.getStockBySite(productId);
  return inventoryFetch<InventoryStockBySite[]>(`/inventory/products/${productId}/stock-by-site`);
}

export async function fetchProductMovements(productId: string): Promise<InventoryMovement[]> {
  if (useInventoryMock()) return inventoryMockStore.getProductMovements(productId);
  return inventoryFetch<InventoryMovement[]>(`/inventory/products/${productId}/movements`);
}

export async function adjustProductStock(
  productId: string,
  quantity: number,
  reason: string,
): Promise<void> {
  if (useInventoryMock()) return inventoryMockStore.adjustStock(productId, quantity, reason);
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
  return inventoryFetch<InventoryReportData>(
    `/inventory/reports?type=${type}&from=${from}&to=${to}`,
  );
}

function mapFormToApi(values: InventoryProductFormValues) {
  return {
    nombre: values.name,
    codigoInterno: values.sku,
    categoriaId: values.categoryId,
    costoPromedioPonderado: values.costPrice,
    stockMinimoBodega: values.minStock,
    stockMaximoBodega: values.maxStock,
    unidadBase: 'UNIT',
    factorConversion: '1',
    aplicaVencimiento: false,
    aplicaLote: false,
    isActive: true,
  };
}
