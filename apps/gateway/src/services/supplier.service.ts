import { Supplier, Prisma } from '@prisma/client';
import { BaseService } from './base.service';
import { NotFoundError, ConflictError } from '../utils/errors';
import { validate, CreateSupplierSchema, UpdateSupplierSchema } from '../utils/validation';
import type { z } from 'zod';

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;

export class SupplierService extends BaseService {
  /**
   * List all active suppliers for a tenant, with optional text filter.
   */
  async findAll(
    tenantId: string,
    opts: {
      limit?: number | null;
      offset?: number | null;
      filter?: string | null;
      isActive?: boolean | null;
      condicionPago?: Supplier['condicionPago'] | null;
    } = {},
  ): Promise<Supplier[]> {
    const { take, skip } = this.paginate(opts);

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

  /**
   * Find a supplier by id, scoped to tenant. Throws NotFoundError if missing.
   */
  async findById(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!supplier) throw new NotFoundError('Supplier', id);
    return supplier;
  }

  /**
   * Full-text search across razonSocial and nit.
   */
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

  /**
   * Create a new supplier for the tenant.
   * Throws ConflictError if a supplier with the same NIT already exists.
   */
  async create(tenantId: string, data: unknown): Promise<Supplier> {
    const validated = validate(CreateSupplierSchema, data);

    const existing = await this.prisma.supplier.findUnique({
      where: { tenantId_nit: { tenantId, nit: validated.nit } },
    });
    if (existing) {
      throw new ConflictError(`A supplier with NIT "${validated.nit}" already exists`);
    }

    return this.prisma.supplier.create({
      data: {
        ...validated,
        tenantId,
        calificacion: validated.calificacion ?? 3,
        cupoCredito: validated.cupoCredito ?? 0,
      },
    });
  }

  /**
   * Update a supplier's fields. Verifies tenant ownership.
   */
  async update(id: string, tenantId: string, data: unknown): Promise<Supplier> {
    await this.findById(id, tenantId); // throws if not found
    const validated = validate(UpdateSupplierSchema, data);

    return this.prisma.supplier.update({
      where: { id },
      data: validated,
    });
  }

  /**
   * Soft-delete a supplier by marking isActive = false.
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    await this.findById(id, tenantId); // throws if not found

    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return true;
  }
}
