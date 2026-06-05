import type {
  InventarioAccentColor,
  InventarioMovementType,
  InventarioSeverity,
} from '@restopsiq/ui';

import type { StockUnit } from '@/features/inventario/types';

export type InventoryItemType = 'product' | 'supply';

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  descripcion?: string;
  category: string;
  categoryId: string;
  supplier: string;
  supplierId?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastMovement: string;
  isActive: boolean;
  itemType: InventoryItemType;
  unidadBase?: StockUnit;
  aplicaVencimiento?: boolean;
  aplicaLote?: boolean;
}

export interface InventoryProductFormValues {
  sku: string;
  name: string;
  descripcion: string;
  categoryId: string;
  costPrice: string;
  minStock: string;
  maxStock: string;
  currentStock: string;
  unidadBase: StockUnit;
  factorConversion: string;
  aplicaVencimiento: boolean;
  aplicaLote: boolean;
}

export interface InventoryMovement {
  id: string;
  date: string;
  movementType: InventarioMovementType;
  product: string;
  productId: string;
  quantity: number;
  site: string;
  user: string;
  reason: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  product: string;
  currentStock: number;
  threshold: number;
  supplier: string;
  severity: InventarioSeverity;
  isResolved: boolean;
  resolvedAt?: string;
}

export interface InventoryStockBySite {
  site: string;
  current: number;
  reserved: number;
  available: number;
}

export interface InventoryDashboardData {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  movementsToday: number;
  topProducts: { label: string; value: number; progress: number; accent: InventarioAccentColor }[];
  stockBySite: { label: string; value: string; progress: number; accent: InventarioAccentColor }[];
  historyOccupancy: { label: string; value: number }[];
}

export interface InventoryReportRow {
  category: string;
  quantity: number;
  percent: string;
}

export interface InventoryReportData {
  rows: InventoryReportRow[];
  distribution: {
    label: string;
    value: string;
    progress: number;
    accent: InventarioAccentColor;
  }[];
  summary: {
    label: string;
    value: string;
    accent: InventarioAccentColor;
  }[];
}

export const INVENTORY_PAGE_SIZE = 20;

export const STOCK_UNIT_OPTIONS: { value: StockUnit; label: string }[] = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'GRAMS', label: 'Gramos' },
  { value: 'KILOGRAMS', label: 'Kilogramos' },
  { value: 'ML', label: 'Mililitros' },
  { value: 'LITERS', label: 'Litros' },
];
