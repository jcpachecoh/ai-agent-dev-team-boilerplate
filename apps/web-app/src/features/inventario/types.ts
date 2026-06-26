export type StockUnit = 'UNIT' | 'GRAMS' | 'KILOGRAMS' | 'ML' | 'LITERS';

export interface SupplyCategoryApi {
  id: string;
  nombre: string;
  prefijo?: string;
  descripcion?: string | null;
  isActive: boolean;
}

export interface SupplyCategoryFormValues {
  nombre: string;
  prefijo: string;
  descripcion: string;
  isActive: boolean;
}

export interface SupplyItemApi {
  id: string;
  nombre: string;
  codigoInterno: string;
  categoriaId: string;
  categoria?: { id: string; nombre: string };
  descripcion?: string | null;
  unidadBase: StockUnit;
  factorConversion: number;
  costoPromedioPonderado: number;
  stockMinimoBodega: number;
  stockMaximoBodega: number;
  aplicaVencimiento: boolean;
  aplicaLote: boolean;
  fechaVencimiento?: string | null;
  lote?: string | null;
  subcategoria?: string | null;
  genero?: string | null;
  talla?: string | null;
  isActive: boolean;
  proveedorPrincipal?: { supplierId: string; razonSocial: string } | null;
  stockDisponible: number | null;
  locationId?: string | null;
  ubicacion?: string | null;
}

export interface SupplyItemSupplierApi {
  supplierId: string;
  razonSocial: string;
  nit: string;
  precioUnitario: number;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
}

export interface PriceHistoryEntryApi {
  id: string;
  costoAnterior: number;
  costoNuevo: number;
  cantidadRecibida?: number | null;
  stockAnterior?: number | null;
  stockNuevo?: number | null;
  motivo?: string | null;
  referenciaTipo?: string | null;
  referenciaId?: string | null;
  createdAt: string;
}

export interface CreateSupplyItemInput {
  nombre: string;
  codigoInterno?: string;
  categoriaId: string;
  descripcion?: string;
  unidadBase: StockUnit;
  factorConversion: string;
  costoPromedioPonderado?: string;
  stockMinimoBodega: string;
  stockMaximoBodega: string;
  stockActualBodega?: string;
  aplicaVencimiento?: boolean;
  aplicaLote?: boolean;
  fechaVencimiento?: string | null;
  lote?: string | null;
  subcategoria?: string | null;
  genero?: string | null;
  talla?: string | null;
  isActive?: boolean;
  locationId?: string;
}

export type UpdateSupplyItemInput = Partial<CreateSupplyItemInput>;

export interface SupplyItemsListFilters {
  search?: string;
  categoriaId?: string;
  isActive?: boolean;
}
