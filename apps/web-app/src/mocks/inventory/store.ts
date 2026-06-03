import type { InventarioSeverity } from '@restopsiq/ui';

import type {
  InventoryAlert,
  InventoryMovement,
  InventoryProduct,
  InventoryProductFormValues,
  InventoryReportData,
  InventoryStockBySite,
} from '@/types/inventory';
import { buildDashboardData, seedMovements, seedProducts, stockBySiteSeed } from './seed';

const MOCK_CATEGORY_LABELS: Record<string, string> = {
  carnes: 'Carnes',
  granos: 'Granos',
  tuberculos: 'Tubérculos',
  aceites: 'Aceites',
  vegetales: 'Vegetales',
};

function computeSeverity(current: number, threshold: number): InventarioSeverity {
  if (current < threshold * 0.5) return 'critical';
  if (current < threshold) return 'warning';
  return 'resolved';
}

function syncAlertsFromProducts(products: InventoryProduct[]): InventoryAlert[] {
  return products
    .filter((p) => p.isActive && p.currentStock < p.minStock)
    .map((p) => ({
      id: `alert-${p.id}`,
      productId: p.id,
      product: p.name,
      currentStock: p.currentStock,
      threshold: p.minStock,
      supplier: p.supplier,
      severity: computeSeverity(p.currentStock, p.minStock),
      isResolved: false,
    }));
}

let products = [...seedProducts];
let movements = [...seedMovements];
let alerts = syncAlertsFromProducts(products);
let resolvedToday = 0;

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const inventoryMockStore = {
  async listProducts(): Promise<InventoryProduct[]> {
    await delay();
    return products.filter((p) => p.isActive);
  },

  async getProduct(id: string): Promise<InventoryProduct | undefined> {
    await delay();
    return products.find((p) => p.id === id && p.isActive);
  },

  async createProduct(values: InventoryProductFormValues): Promise<InventoryProduct> {
    await delay();
    const product: InventoryProduct = {
      id: String(Date.now()),
      sku: values.sku.trim().toUpperCase(),
      name: values.name.trim().toUpperCase(),
      descripcion: values.descripcion.trim() || undefined,
      category: MOCK_CATEGORY_LABELS[values.categoryId] ?? values.categoryId,
      categoryId: values.categoryId,
      supplier: '—',
      costPrice: Number(values.costPrice),
      sellingPrice: 0,
      currentStock: 0,
      minStock: Number(values.minStock),
      maxStock: Number(values.maxStock),
      lastMovement: new Date().toISOString().slice(0, 10),
      isActive: true,
      itemType: 'supply',
      unidadBase: values.unidadBase,
      aplicaVencimiento: values.aplicaVencimiento,
      aplicaLote: values.aplicaLote,
    };
    products = [...products, product];
    alerts = syncAlertsFromProducts(products);
    return product;
  },

  async updateProduct(id: string, values: InventoryProductFormValues): Promise<InventoryProduct> {
    await delay();
    products = products.map((p) =>
      p.id === id
        ? {
            ...p,
            sku: values.sku.trim().toUpperCase(),
            name: values.name.trim().toUpperCase(),
            descripcion: values.descripcion.trim() || undefined,
            category: MOCK_CATEGORY_LABELS[values.categoryId] ?? values.categoryId,
            categoryId: values.categoryId,
            costPrice: Number(values.costPrice),
            sellingPrice: 0,
            minStock: Number(values.minStock),
            maxStock: Number(values.maxStock),
            unidadBase: values.unidadBase,
            aplicaVencimiento: values.aplicaVencimiento,
            aplicaLote: values.aplicaLote,
          }
        : p,
    );
    const updated = products.find((p) => p.id === id)!;
    alerts = syncAlertsFromProducts(products);
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    await delay();
    products = products.map((p) => (p.id === id ? { ...p, isActive: false } : p));
    alerts = alerts.filter((a) => a.productId !== id);
  },

  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    await delay(50);
    return products.some(
      (p) => p.isActive && p.sku.toLowerCase() === sku.trim().toLowerCase() && p.id !== excludeId,
    );
  },

  async getDashboard() {
    await delay();
    return buildDashboardData(products, alerts, movements);
  },

  async listMovements(): Promise<InventoryMovement[]> {
    await delay();
    return movements;
  },

  async listAlerts(): Promise<InventoryAlert[]> {
    await delay();
    return alerts.filter((a) => !a.isResolved);
  },

  async resolveAlert(id: string): Promise<void> {
    await delay();
    alerts = alerts.map((a) =>
      a.id === id ? { ...a, isResolved: true, severity: 'resolved' } : a,
    );
    resolvedToday += 1;
  },

  getAlertSummary() {
    const pending = alerts.filter((a) => !a.isResolved);
    return {
      critical: pending.filter((a) => a.severity === 'critical').length,
      warning: pending.filter((a) => a.severity === 'warning').length,
      resolvedToday,
    };
  },

  async getStockBySite(productId: string): Promise<InventoryStockBySite[]> {
    await delay();
    return (
      stockBySiteSeed[productId] ?? [
        { site: 'Planta Central', current: 0, reserved: 0, available: 0 },
      ]
    );
  },

  async getProductMovements(productId: string): Promise<InventoryMovement[]> {
    await delay();
    return movements
      .filter((m) => m.productId === productId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
  },

  async adjustStock(productId: string, quantity: number, reason: string): Promise<void> {
    await delay();
    products = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            currentStock: Math.max(0, p.currentStock + quantity),
            lastMovement: new Date().toISOString().slice(0, 10),
          }
        : p,
    );
    movements = [
      {
        id: `m-${Date.now()}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        movementType: 'ajuste',
        product: products.find((p) => p.id === productId)?.name ?? '',
        productId,
        quantity,
        site: 'Planta Central',
        user: 'Usuario actual',
        reason,
      },
      ...movements,
    ];
    alerts = syncAlertsFromProducts(products);
  },

  async getReport(_type: string, _from: string, _to: string): Promise<InventoryReportData> {
    await delay(200);
    return {
      rows: [
        { category: 'Carnes', quantity: 1670, percent: '35%' },
        { category: 'Granos', quantity: 1200, percent: '25%' },
        { category: 'Tubérculos', quantity: 950, percent: '20%' },
        { category: 'Aceites', quantity: 600, percent: '12%' },
        { category: 'Vegetales', quantity: 380, percent: '8%' },
      ],
      distribution: [
        { label: 'Carnes', value: '35%', progress: 35, accent: 'success' },
        { label: 'Granos', value: '25%', progress: 25, accent: 'info' },
        { label: 'Tubérculos', value: '20%', progress: 20, accent: 'purple' },
        { label: 'Aceites', value: '12%', progress: 12, accent: 'enterprise' },
        { label: 'Vegetales', value: '8%', progress: 8, accent: 'danger' },
      ],
      summary: [
        { label: 'Items Totales', value: '5,000', accent: 'success' },
        { label: 'Valor Promedio', value: '$12,500', accent: 'info' },
        { label: 'Movimientos', value: '245', accent: 'purple' },
        { label: 'Rotación', value: '8.5 días', accent: 'enterprise' },
      ],
    };
  },
};
