import type {
  InventarioAccentColor,
  InventarioMovementType,
  InventarioSeverity,
} from '@restopsiq/ui';

export type InventoryItemType = 'product' | 'supply';

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryId: string;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastMovement: string;
  isActive: boolean;
  itemType: InventoryItemType;
}

export interface InventoryProductFormValues {
  sku: string;
  name: string;
  categoryId: string;
  supplier: string;
  costPrice: string;
  sellingPrice: string;
  minStock: string;
  maxStock: string;
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

export const INVENTORY_CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'carnes', label: 'Carnes' },
  { value: 'granos', label: 'Granos' },
  { value: 'tuberculos', label: 'Tubérculos' },
  { value: 'aceites', label: 'Aceites' },
  { value: 'vegetales', label: 'Vegetales' },
] as const;

export const INVENTORY_SUPPLIERS = [
  { value: 'all', label: 'Todos los proveedores' },
  { value: 'agrosuper', label: 'Agrosuper' },
  { value: 'frigorifico', label: 'Frigorífico del Llano' },
  { value: 'arroz-diana', label: 'Arroz Diana' },
  { value: 'lloreda', label: 'Lloreda' },
  { value: 'agro-boyaca', label: 'Agro Boyacá' },
] as const;
