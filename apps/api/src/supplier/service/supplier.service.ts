import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { validate, CreateSupplierSchema, UpdateSupplierSchema } from '../../utils/validation';
import { SupplierDocumentsService } from '../../supplier-documents/service/supplier-documents.service';
import type { SupplierLogisticsInput } from '../../supplier-logistics/interfaces/supplier-logistics.interfaces';
import { SupplierLogisticsService } from '../../supplier-logistics/service/supplier-logistics.service';
import { SupplierRepository } from '../repository/supplier.repository';
import type {
  ISupplierService,
  FindSuppliersOptions,
  SupplierWithProductCount,
} from '../interfaces/supplier.interfaces';

function extractLogisticsPayload(data: unknown): {
  supplierData: unknown;
  logistics?: SupplierLogisticsInput;
  saveLogisticsAsDraft?: boolean;
} {
  if (!data || typeof data !== 'object') {
    return { supplierData: data };
  }

  const record = data as Record<string, unknown>;
  const { logistics, saveLogisticsAsDraft, ...supplierData } = record;

  return {
    supplierData,
    logistics: logistics as SupplierLogisticsInput | undefined,
    saveLogisticsAsDraft:
      typeof saveLogisticsAsDraft === 'boolean' ? saveLogisticsAsDraft : undefined,
  };
}

function shouldEnforceRequiredDocuments(
  existing: SupplierWithProductCount,
  isActive: boolean | undefined,
  saveLogisticsAsDraft: boolean | undefined,
): boolean {
  if (saveLogisticsAsDraft === true) {
    return false;
  }

  return isActive === true && existing.isActive === false;
}

@Injectable()
export class SupplierService implements ISupplierService {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly supplierDocumentsService: SupplierDocumentsService,
    private readonly supplierLogisticsService: SupplierLogisticsService,
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

  async create(tenantId: string, data: unknown, actorUserId?: string | null): Promise<Supplier> {
    const { supplierData, logistics, saveLogisticsAsDraft } = extractLogisticsPayload(data);
    const validated = validate(CreateSupplierSchema, supplierData);

    const existing = await this.supplierRepository.findByNit(tenantId, validated.nit);
    if (existing) {
      throw new ConflictException(`A supplier with NIT "${validated.nit}" already exists`);
    }

    const supplier = await this.supplierRepository.create(tenantId, {
      ...validated,
      calificacion: validated.calificacion ?? 3,
      cupoCredito: validated.cupoCredito ?? 0,
    });

    if (logistics) {
      await this.supplierLogisticsService.upsert({
        tenantId,
        supplierId: supplier.id,
        input: logistics,
        saveAsDraft: saveLogisticsAsDraft ?? false,
        actorUserId,
      });
    }

    return supplier;
  }

  async update(
    id: string,
    tenantId: string,
    data: unknown,
    actorUserId?: string | null,
  ): Promise<Supplier> {
    const existing = await this.findById(id, tenantId);
    const { supplierData, logistics, saveLogisticsAsDraft } = extractLogisticsPayload(data);
    const validated = validate(UpdateSupplierSchema, supplierData);

    if (shouldEnforceRequiredDocuments(existing, validated.isActive, saveLogisticsAsDraft)) {
      const requiredPending = await this.supplierDocumentsService.getRequiredPending(tenantId, id);
      if (requiredPending.length > 0) {
        throw new BadRequestException({
          message: 'Faltan documentos obligatorios del proveedor',
          requiredPending,
        });
      }
    }

    const supplier = await this.supplierRepository.update(id, validated as any);

    if (logistics) {
      await this.supplierLogisticsService.upsert({
        tenantId,
        supplierId: id,
        input: logistics,
        saveAsDraft: saveLogisticsAsDraft ?? false,
        actorUserId,
      });
    }

    return supplier;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    await this.findById(id, tenantId);
    await this.supplierRepository.softDelete(id);
    return true;
  }
}
