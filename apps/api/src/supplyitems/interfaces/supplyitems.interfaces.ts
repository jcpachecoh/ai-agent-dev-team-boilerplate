import type { SupplyItem, SupplierProduct, Supplier } from '@prisma/client';
import type { CreateSupplyItemDto } from '../controller/dto/create-supplyitem.dto';
import type { UpdateSupplyItemDto } from '../controller/dto/update-supplyitem.dto';

export interface CreateSupplyItemData extends Omit<CreateSupplyItemDto, 'categoriaId'> {
  tenantId: string;
  categoriaId: string;
}

export interface UpdateSupplyItemData extends Partial<CreateSupplyItemData> {}

export interface SupplierWithProductInfo extends Partial<Supplier> {
  supplierId: string;
  precioUnitario: any; // Decimal
  unidadCompra: string;
  factorConversion: any; // Decimal
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
}

export interface ISupplyitemsRepository {
  findAll(tenantId: string): Promise<SupplyItem[]>;
  findById(tenantId: string, id: string): Promise<SupplyItem | null>;
  findByCodigo(tenantId: string, codigo: string): Promise<SupplyItem | null>;
  create(data: CreateSupplyItemData): Promise<SupplyItem>;
  update(tenantId: string, id: string, data: UpdateSupplyItemData): Promise<SupplyItem>;
  delete(tenantId: string, id: string): Promise<SupplyItem>;
  findSuppliers(tenantId: string, id: string): Promise<SupplierWithProductInfo[]>;
  findCategoryById(tenantId: string, id: string): Promise<{ id: string } | null>;
}

export interface ISupplyitemsService {
  findAll(tenantId: string): Promise<SupplyItem[]>;
  findOne(tenantId: string, id: string): Promise<SupplyItem>;
  create(tenantId: string, dto: CreateSupplyItemDto): Promise<SupplyItem>;
  update(tenantId: string, id: string, dto: UpdateSupplyItemDto): Promise<SupplyItem>;
  remove(tenantId: string, id: string): Promise<SupplyItem>;
  findSuppliers(tenantId: string, id: string): Promise<SupplierWithProductInfo[]>;
}
