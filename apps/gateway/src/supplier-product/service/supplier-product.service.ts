import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SupplierProductRepository } from '../repository/supplier-product.repository';
import type {
  ISupplierProductService,
  SupplierProductWithSupplyItem,
} from '../interfaces/supplier-product.interfaces';
import {
  validate,
  CreateSupplierProductSchema,
  UpdateSupplierProductSchema,
} from '../../utils/validation';

@Injectable()
export class SupplierProductService implements ISupplierProductService {
  constructor(private readonly supplierProductRepository: SupplierProductRepository) {}

  async findBySupplierId(
    tenantId: string,
    supplierId: string,
  ): Promise<SupplierProductWithSupplyItem[]> {
    const exists = await this.supplierProductRepository.assertSupplierExists(tenantId, supplierId);
    if (!exists) throw new NotFoundException(`Supplier with id "${supplierId}" not found`);
    return this.supplierProductRepository.findBySupplierId(tenantId, supplierId);
  }

  async create(tenantId: string, data: unknown): Promise<SupplierProductWithSupplyItem> {
    const validated = validate(CreateSupplierProductSchema, data);

    const supplierExists = await this.supplierProductRepository.assertSupplierExists(
      tenantId,
      validated.supplierId,
    );
    if (!supplierExists)
      throw new NotFoundException(`Supplier with id "${validated.supplierId}" not found`);

    const supplyItemExists = await this.supplierProductRepository.assertSupplyItemExists(
      tenantId,
      validated.supplyItemId,
    );
    if (!supplyItemExists)
      throw new NotFoundException(`SupplyItem with id "${validated.supplyItemId}" not found`);

    const existing = await this.supplierProductRepository.findExisting(
      tenantId,
      validated.supplierId,
      validated.supplyItemId,
    );
    if (existing) throw new ConflictException('This supply item is already linked to the supplier');

    return this.supplierProductRepository.create(tenantId, {
      supplierId: validated.supplierId,
      supplyItemId: validated.supplyItemId,
      precioUnitario: validated.precioUnitario,
      unidadCompra: validated.unidadCompra,
      factorConversion: validated.factorConversion,
      tiempoEntregaDias: validated.tiempoEntregaDias ?? 1,
      esProveedorPrincipal: validated.esProveedorPrincipal ?? false,
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: unknown,
  ): Promise<SupplierProductWithSupplyItem> {
    const validated = validate(UpdateSupplierProductSchema, data);
    const existing = await this.supplierProductRepository.findById(id, tenantId);
    if (!existing) throw new NotFoundException(`SupplierProduct with id "${id}" not found`);

    const precioChanged =
      validated.precioUnitario !== undefined &&
      Number(validated.precioUnitario) !== Number(existing.precioUnitario);

    if (precioChanged) {
      return this.supplierProductRepository.updateWithPriceHistory(
        id,
        tenantId,
        existing,
        validated,
      );
    }

    return this.supplierProductRepository.update(id, validated as any);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const existing = await this.supplierProductRepository.findById(id, tenantId);
    if (!existing) throw new NotFoundException(`SupplierProduct with id "${id}" not found`);
    await this.supplierProductRepository.delete(id);
    return true;
  }

  async getPreviousPrice(tenantId: string, supplyItemId: string): Promise<number | null> {
    return this.supplierProductRepository.getPreviousPrice(tenantId, supplyItemId);
  }
}
