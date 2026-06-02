import { SupplierProduct, SupplyItem, Prisma } from '@prisma/client';

export type SupplierProductWithSupplyItem = SupplierProduct & { supplyItem: SupplyItem };

export interface CreateSupplierProductInput {
  supplierId: string;
  supplyItemId: string;
  precioUnitario: number;
  unidadCompra: string;
  factorConversion: number;
  tiempoEntregaDias?: number;
  esProveedorPrincipal?: boolean;
}

export interface UpdateSupplierProductInput {
  precioUnitario?: number;
  unidadCompra?: string;
  factorConversion?: number;
  tiempoEntregaDias?: number;
  esProveedorPrincipal?: boolean;
}

export interface ISupplierProductRepository {
  findBySupplierId(tenantId: string, supplierId: string): Promise<SupplierProductWithSupplyItem[]>;
  findById(id: string, tenantId: string): Promise<SupplierProduct | null>;
  findExisting(
    tenantId: string,
    supplierId: string,
    supplyItemId: string,
  ): Promise<SupplierProduct | null>;
  create(
    tenantId: string,
    data: CreateSupplierProductInput,
  ): Promise<SupplierProductWithSupplyItem>;
  updateWithPriceHistory(
    id: string,
    tenantId: string,
    existing: SupplierProduct,
    data: UpdateSupplierProductInput,
  ): Promise<SupplierProductWithSupplyItem>;
  update(
    id: string,
    data: Prisma.SupplierProductUpdateInput,
  ): Promise<SupplierProductWithSupplyItem>;
  delete(id: string): Promise<void>;
  getPreviousPrice(tenantId: string, supplyItemId: string): Promise<number | null>;
  assertSupplierExists(tenantId: string, supplierId: string): Promise<boolean>;
  assertSupplyItemExists(tenantId: string, supplyItemId: string): Promise<boolean>;
}

export interface ISupplierProductService {
  findBySupplierId(tenantId: string, supplierId: string): Promise<SupplierProductWithSupplyItem[]>;
  create(tenantId: string, data: unknown): Promise<SupplierProductWithSupplyItem>;
  update(id: string, tenantId: string, data: unknown): Promise<SupplierProductWithSupplyItem>;
  delete(id: string, tenantId: string): Promise<boolean>;
  getPreviousPrice(tenantId: string, supplyItemId: string): Promise<number | null>;
}
