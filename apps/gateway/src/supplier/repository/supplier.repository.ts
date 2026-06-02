import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Supplier, Prisma } from '@prisma/client';
import type {
  ISupplierRepository,
  FindSuppliersOptions,
  CreateSupplierInput,
} from '../interfaces/supplier.interfaces';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../utils/constants';

@Injectable()
export class SupplierRepository implements ISupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, opts: FindSuppliersOptions): Promise<Supplier[]> {
    const take = Math.min(Math.max(1, opts.limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = Math.max(0, opts.offset ?? 0);

    const where: Prisma.SupplierWhereInput = {
      tenantId,
      ...(opts.isActive !== undefined && opts.isActive !== null ? { isActive: opts.isActive } : {}),
      ...(opts.condicionPago ? { condicionPago: opts.condicionPago } : {}),
      ...(opts.filter
        ? {
            OR: [
              { razonSocial: { contains: opts.filter, mode: 'insensitive' } },
              { nit: { contains: opts.filter, mode: 'insensitive' } },
              { ciudad: { contains: opts.filter, mode: 'insensitive' } },
              { contactoNombre: { contains: opts.filter, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.supplier.findMany({ where, take, skip, orderBy: { razonSocial: 'asc' } });
  }

  async findById(id: string, tenantId: string): Promise<Supplier | null> {
    return this.prisma.supplier.findFirst({ where: { id, tenantId } });
  }

  async search(tenantId: string, query: string): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { razonSocial: { contains: query, mode: 'insensitive' } },
          { nit: { contains: query, mode: 'insensitive' } },
          { contactoNombre: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { razonSocial: 'asc' },
    });
  }

  async create(
    tenantId: string,
    data: CreateSupplierInput & { calificacion: number; cupoCredito: number },
  ): Promise<Supplier> {
    return this.prisma.supplier.create({
      data: {
        ...data,
        tenantId,
      } as Prisma.SupplierCreateInput,
    });
  }

  async findByNit(tenantId: string, nit: string): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({
      where: { tenantId_nit: { tenantId, nit } },
    });
  }

  async update(id: string, data: Prisma.SupplierUpdateInput): Promise<Supplier> {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
  }

  async countProducts(tenantId: string, supplierId: string): Promise<number> {
    return this.prisma.supplierProduct.count({ where: { tenantId, supplierId } });
  }
}
