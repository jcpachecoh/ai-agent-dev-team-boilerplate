import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { validate, CreateSupplierSchema, UpdateSupplierSchema } from '../../utils/validation';
import { SupplierDocumentsService } from '../../supplier-documents/service/supplier-documents.service';
import { SupplierRepository } from '../repository/supplier.repository';
import type {
  ISupplierService,
  FindSuppliersOptions,
  SupplierWithProductCount,
} from '../interfaces/supplier.interfaces';

@Injectable()
export class SupplierService implements ISupplierService {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly supplierDocumentsService: SupplierDocumentsService,
  ) {}

  async findAll(
    tenantId: string,
    opts: FindSuppliersOptions = {},
  ): Promise<SupplierWithProductCount[]> {
    return this.supplierRepository.findAll(tenantId, opts);
  }

  async findById(id: string, tenantId: string): Promise<SupplierWithProductCount> {
    const supplier = await this.supplierRepository.findById(id, tenantId);
    if (!supplier) throw new NotFoundException(`Supplier with id "${id}" not found`);
    return supplier;
  }

  async search(tenantId: string, query: string): Promise<SupplierWithProductCount[]> {
    return this.supplierRepository.search(tenantId, query);
  }

  async countProducts(tenantId: string, supplierId: string): Promise<number> {
    return this.supplierRepository.countProducts(tenantId, supplierId);
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
    await this.findById(id, tenantId);
    const validated = validate(UpdateSupplierSchema, data);

    const requiredPending = await this.supplierDocumentsService.getRequiredPending(tenantId, id);
    if (requiredPending.length > 0) {
      throw new BadRequestException({
        message: 'Faltan documentos obligatorios del proveedor',
        requiredPending,
      });
    }

    return this.supplierRepository.update(id, validated as any);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    await this.findById(id, tenantId);
    await this.supplierRepository.softDelete(id);
    return true;
  }
}
