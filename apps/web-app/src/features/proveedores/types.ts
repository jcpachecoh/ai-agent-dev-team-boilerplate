import type {
  ProveedorCatalogStatus,
  ProveedorPriceTrend,
  ProveedorSupplierStatus,
} from '@restopsiq/ui';

export type CondicionPago = 'CONTADO' | 'DIAS_15' | 'DIAS_30' | 'DIAS_60';
export type SupplierTipo = 'PERSONA_NATURAL' | 'PERSONA_JURIDICA';
export type StockUnit = 'UNIT' | 'GRAMS' | 'KILOGRAMS' | 'ML' | 'LITERS';

export type SupplierStatusFilter = 'all' | ProveedorSupplierStatus;
export type CondicionPagoFilter = 'all' | CondicionPago;
export type ProveedorDetailTabId = 'info' | 'catalog' | 'history' | 'quality' | 'payables';

export interface SupplierListFilters {
  search?: string;
  isActive?: boolean;
  condicionPago?: CondicionPago;
}

export interface SupplierApiModel {
  id: string;
  razonSocial: string;
  nit: string;
  dv?: string | null;
  tipo: SupplierTipo;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  email?: string | null;
  contactoNombre?: string | null;
  condicionPago: CondicionPago;
  cupoCredito: number;
  calificacion: number;
  isActive: boolean;
  productCount?: number;
}

export interface SupplyItemApiModel {
  id: string;
  nombre: string;
  codigoInterno: string;
  unidadBase: StockUnit;
}

export interface SupplierProductApiModel {
  id: string;
  supplierId: string;
  supplyItemId: string;
  precioUnitario: number;
  precioAnterior?: number | null;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
  supplyItem: SupplyItemApiModel;
}

export type CreateSupplierInput = Omit<SupplierFormValues, 'isActive'> & { isActive?: boolean };

export type UpdateSupplierInput = Partial<SupplierFormValues>;

export interface CreateSupplierProductInput {
  supplierId: string;
  supplyItemId: string;
  precioUnitario: number;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
}

export interface UpdateSupplierProductInput {
  precioUnitario?: number;
  unidadCompra?: StockUnit;
  factorConversion?: number;
  tiempoEntregaDias?: number;
  esProveedorPrincipal?: boolean;
}

export interface SupplierViewModel {
  id: string;
  displayCode: string;
  razonSocial: string;
  nit: string;
  dv?: string;
  tipo: SupplierTipo;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  contactoNombre?: string;
  condicionPago: CondicionPago;
  cupoCredito: number;
  calificacion: number;
  isActive: boolean;
  status: ProveedorSupplierStatus;
  categoryLabel: string;
  leadTimeLabel: string;
  balanceCxp: number;
  lastPurchaseOrderDate?: string;
  productCount?: number;
}

export type SupplierFormValues = Omit<
  SupplierViewModel,
  | 'id'
  | 'displayCode'
  | 'status'
  | 'categoryLabel'
  | 'leadTimeLabel'
  | 'balanceCxp'
  | 'lastPurchaseOrderDate'
  | 'calificacion'
>;

/** @deprecated Use SupplierCatalogRow */
export type SupplierCatalogRowMock = SupplierCatalogRow;

export interface SupplierCatalogRow {
  supplierProductId: string;
  supplyItemId: string;
  productName: string;
  sku: string;
  precioUnitario: number;
  precioAnterior?: number;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
  catalogStatus: ProveedorCatalogStatus;
}

export interface SupplierCatalogProductFormValues {
  productName: string;
  sku: string;
  unit: StockUnit;
  precioUnitario: number;
  moqQuantity: number;
  catalogStatus: ProveedorCatalogStatus;
}

export interface SupplierListMetrics {
  activeCount: number;
  pendingCount: number;
  totalBalanceCxp: number;
  totalProducts: number;
}

export type { ProveedorPriceTrend };
