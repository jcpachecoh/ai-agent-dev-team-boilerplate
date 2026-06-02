import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { SupplierRepository } from '../repository/supplier.repository';
import type { ISupplierService, FindSuppliersOptions } from '../interfaces/supplier.interfaces';
import { validate, CreateSupplierSchema, UpdateSupplierSchema } from '../../utils/validation';

@Injectable()
export class SupplierService implements ISupplierService {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async findAll(tenantId: string, opts: FindSuppliersOptions = {}): Promise<Supplier[]> {
    return this.supplierRepository.findAll(tenantId, opts);
  }

  async findById(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findById(id, tenantId);
    if (!supplier) throw new NotFoundException(`Supplier with id "${id}" not found`);
    return supplier;
  }

  async search(tenantId: string, query: string): Promise<Supplier[]> {
    return this.supplierRepository.search(tenantId, query);
  }

  async create(tenantId: string, data: unknown): Promise<Supplier> {
    const validated = validate(CreateSupplierSchema, data);

    const existing = await this.supplierRepository.findByNit(tenantId, validated.nit);
    if (existing) {
      throw new ConflictException(`A supplier with NIT "${validated.nit}" already exists`);
    }

    return this.supplierRepository.create(tenantId, {
      ...validated,
      calificacion: validated.calificacion ?? 3,
      cupoCredito: validated.cupoCredito ?? 0,
    });
  }

  async update(id: string, tenantId: string, data: unknown): Promise<Supplier> {
    await this.findById(id, tenantId); // throws if not found
    const validated = validate(UpdateSupplierSchema, data);
    return this.supplierRepository.update(id, validated as any);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    await this.findById(id, tenantId); // throws if not found
    await this.supplierRepository.softDelete(id);
    return true;
  }
}
