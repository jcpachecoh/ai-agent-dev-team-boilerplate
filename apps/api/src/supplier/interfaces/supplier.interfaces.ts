import { Prisma, Supplier } from '@prisma/client';

export interface FindSuppliersOptions {
  filter?: string | null;
  isActive?: boolean | null;
  condicionPago?: Supplier['condicionPago'] | null;
  limit?: number | null;
  offset?: number | null;
}

export interface CreateSupplierInput {
  razonSocial: string;
  nit: string;
  dv?: string;
  tipo: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  contactoNombre?: string;
  condicionPago: string;
  cupoCredito?: number;
  calificacion?: number;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  isActive?: boolean;
}

export interface ISupplierRepository {
  findAll(tenantId: string, opts: FindSuppliersOptions): Promise<SupplierWithProductCount[]>;
  findById(id: string, tenantId: string): Promise<SupplierWithProductCount | null>;
  search(tenantId: string, query: string): Promise<SupplierWithProductCount[]>;
  create(
    tenantId: string,
    data: CreateSupplierInput & { calificacion: number; cupoCredito: number },
  ): Promise<Supplier>;
  findByNit(tenantId: string, nit: string): Promise<Supplier | null>;
  update(id: string, data: Prisma.SupplierUpdateInput): Promise<Supplier>;
  softDelete(id: string): Promise<void>;
  countProducts(tenantId: string, supplierId: string): Promise<number>;
}

export type SupplierWithProductCount = Supplier & { _count: { products: number } };

export interface ISupplierService {
  findAll(tenantId: string, opts: FindSuppliersOptions): Promise<SupplierWithProductCount[]>;
  findById(id: string, tenantId: string): Promise<SupplierWithProductCount>;
  search(tenantId: string, query: string): Promise<SupplierWithProductCount[]>;
  create(tenantId: string, data: unknown): Promise<Supplier>;
  update(id: string, tenantId: string, data: unknown): Promise<Supplier>;
  delete(id: string, tenantId: string): Promise<boolean>;
  countProducts(tenantId: string, supplierId: string): Promise<number>;
}
