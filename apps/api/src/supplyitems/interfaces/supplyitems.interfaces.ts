import type { SupplyItem, SupplyItemPriceHistory, StockUnit } from '@prisma/client';
import type { SupplyItemWithRelations } from '../mapper/supply-item.mapper';

export interface ISupplyitemsRepository {
  findOne(tenantId: string, id: string): Promise<SupplyItem | null>;
  findOneDetailed(tenantId: string, id: string): Promise<SupplyItemWithRelations | null>;
  findAll(tenantId: string, options?: FindSupplyItemsOptions): Promise<SupplyItemWithRelations[]>;
  findByCodigoInterno(tenantId: string, codigoInterno: string): Promise<SupplyItem | null>;
  create(
    tenantId: string,
    data: CreateSupplyItemData & { codigoInterno: string },
  ): Promise<SupplyItemWithRelations>;
  update(
    tenantId: string,
    id: string,
    data: UpdateSupplyItemData,
  ): Promise<SupplyItemWithRelations>;
  findSuppliersForItem(tenantId: string, supplyItemId: string): Promise<SupplyItemSupplierRow[]>;
  findPriceHistory(
    tenantId: string,
    supplyItemId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<SupplyItemPriceHistory[]>;
  categoryExists(tenantId: string, categoriaId: string): Promise<boolean>;
  findCategoryPrefijo(tenantId: string, categoriaId: string): Promise<string | null>;
  findCategoryNombre(tenantId: string, categoriaId: string): Promise<string | null>;
  findCodigosInternosByCategory(tenantId: string, categoriaId: string): Promise<string[]>;
}

export interface ISupplyitemsService {
  findOne(tenantId: string, id: string): Promise<SupplyItemWithRelations>;
  findAll(tenantId: string, options?: FindSupplyItemsOptions): Promise<SupplyItemWithRelations[]>;
  create(tenantId: string, data: CreateSupplyItemData): Promise<SupplyItemWithRelations>;
  update(
    tenantId: string,
    id: string,
    data: UpdateSupplyItemData,
  ): Promise<SupplyItemWithRelations>;
  deactivate(tenantId: string, id: string): Promise<SupplyItemWithRelations>;
  findSuppliers(tenantId: string, id: string): Promise<SupplyItemSupplierRow[]>;
  findPriceHistory(
    tenantId: string,
    id: string,
    options?: { limit?: number; offset?: number },
  ): Promise<SupplyItemPriceHistory[]>;
  getNextCodigoInterno(tenantId: string, categoriaId: string): Promise<string>;
}

export interface FindSupplyItemsOptions {
  search?: string;
  categoriaId?: string;
  codigoInterno?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateSupplyItemData {
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
  fechaVencimiento?: string | Date | null;
  lote?: string | null;
  subcategoria?: string | null;
  genero?: string | null;
  talla?: string | null;
  isActive?: boolean;
}

export interface UpdateSupplyItemData {
  nombre?: string;
  codigoInterno?: string;
  categoriaId?: string;
  descripcion?: string;
  unidadBase?: StockUnit;
  factorConversion?: string;
  costoPromedioPonderado?: string;
  stockMinimoBodega?: string;
  stockMaximoBodega?: string;
  stockActualBodega?: string;
  aplicaVencimiento?: boolean;
  aplicaLote?: boolean;
  fechaVencimiento?: string | Date | null;
  lote?: string | null;
  subcategoria?: string | null;
  genero?: string | null;
  talla?: string | null;
  isActive?: boolean;
}

export interface SupplyItemSupplierRow {
  supplierId: string;
  razonSocial: string;
  nit: string;
  precioUnitario: number;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
}
