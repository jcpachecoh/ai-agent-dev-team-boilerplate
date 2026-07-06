import type {
  ProveedorCatalogStatus,
  ProveedorPriceTrend,
  ProveedorSupplierStatus,
} from '@restopsiq/ui';

export type CondicionPago = 'CONTADO' | 'DIAS_15' | 'DIAS_30' | 'DIAS_60';
export type SupplierTipo = 'PERSONA_NATURAL' | 'PERSONA_JURIDICA';
export type StockUnit = 'UNIT' | 'GRAMS' | 'KILOGRAMS' | 'ML' | 'LITERS' | 'BOX';

export type SupplierDeliveryMode = 'SUPPLIER_DELIVERS' | 'COMPANY_PICKUP';
export type SupplierDeliveryPlace = 'PLANT' | 'PDV' | 'WAREHOUSE' | 'OTHER';
export type SupplierTransportType = 'OWN' | 'THIRD_PARTY';
export type SupplierLogisticsStatus = 'DRAFT' | 'COMPLETE';
export type SupplierTransportCostCurrency = 'COP' | 'USD';

export interface SupplierLogisticsApiModel {
  id: string;
  deliveryMode?: SupplierDeliveryMode | null;
  deliveryPlace?: SupplierDeliveryPlace | null;
  deliveryPlaceCustom?: string | null;
  deliveryDays: number[];
  leadTimeDays?: number | null;
  timeWindowStart?: string | null;
  timeWindowEnd?: string | null;
  receptionResponsible?: { id: string; email: string; name?: string | null } | null;
  receptionResponsibleStale: boolean;
  transportType?: SupplierTransportType | null;
  requiresColdChain: boolean;
  transportTempMinC?: number | null;
  transportTempMaxC?: number | null;
  transportCost?: number | null;
  transportCostCurrency?: SupplierTransportCostCurrency | null;
  minimumOrderQty?: number | null;
  minimumOrderUnit?: string | null;
  coverageLocations: Array<{ id: string; name: string }>;
  status: SupplierLogisticsStatus;
}

export interface SupplierLogisticsFormValues {
  deliveryMode: SupplierDeliveryMode | '';
  deliveryPlace: SupplierDeliveryPlace | '';
  deliveryPlaceCustom: string;
  deliveryDays: number[];
  leadTimeDays: number | null;
  timeWindowStart: string;
  timeWindowEnd: string;
  receptionResponsibleUserId: string;
  transportType: SupplierTransportType | '';
  requiresColdChain: boolean;
  transportTempMinC: number | null;
  transportTempMaxC: number | null;
  transportCost: number | null;
  transportCostCurrency: SupplierTransportCostCurrency;
  minimumOrderQty: number | null;
  minimumOrderUnit: string;
  coverageLocationIds: string[];
}

export interface SupplierLogisticsHistoryEntry {
  id: string;
  action: string;
  actorEmail?: string | null;
  createdAt: string;
  changes: Array<{ field: string; oldValue?: string | null; newValue?: string | null }>;
}

export type SupplierStatusFilter = 'all' | ProveedorSupplierStatus;
export type CondicionPagoFilter = 'all' | CondicionPago;
export type ProveedorDetailTabId = 'info' | 'catalog' | 'history' | 'documentation' | 'payables';

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
  departamento?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  email?: string | null;
  contactoNombre?: string | null;
  condicionPago: CondicionPago;
  cupoCredito: number;
  calificacion: number;
  isActive: boolean;
  productCount?: number;
  logistics?: SupplierLogisticsApiModel | null;
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

export type CreateSupplierInput = Omit<SupplierFormValues, 'isActive' | 'logistics'> & {
  isActive?: boolean;
  logistics?: ReturnType<typeof mapLogisticsFormToInput>;
  saveLogisticsAsDraft?: boolean;
};

export type UpdateSupplierInput = Partial<Omit<SupplierFormValues, 'logistics'>> & {
  logistics?: ReturnType<typeof mapLogisticsFormToInput>;
  saveLogisticsAsDraft?: boolean;
};

export function mapLogisticsFormToInput(logistics: SupplierLogisticsFormValues) {
  return {
    deliveryMode: logistics.deliveryMode || undefined,
    deliveryPlace: logistics.deliveryPlace || undefined,
    deliveryPlaceCustom: logistics.deliveryPlaceCustom.trim() || undefined,
    deliveryDays: logistics.deliveryDays,
    leadTimeDays: logistics.leadTimeDays ?? undefined,
    timeWindowStart: logistics.timeWindowStart || undefined,
    timeWindowEnd: logistics.timeWindowEnd || undefined,
    receptionResponsibleUserId: logistics.receptionResponsibleUserId || undefined,
    transportType: logistics.transportType || undefined,
    requiresColdChain: logistics.requiresColdChain,
    transportTempMinC: logistics.transportTempMinC ?? undefined,
    transportTempMaxC: logistics.transportTempMaxC ?? undefined,
    transportCost: logistics.transportCost ?? undefined,
    transportCostCurrency: logistics.transportCostCurrency,
    minimumOrderQty: logistics.minimumOrderQty ?? undefined,
    minimumOrderUnit: logistics.minimumOrderUnit.trim() || undefined,
    coverageLocationIds: logistics.coverageLocationIds,
  };
}

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
  departamento?: string;
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
  logistics?: SupplierLogisticsApiModel | null;
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
  | 'logistics'
> & {
  logistics: SupplierLogisticsFormValues;
};

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
