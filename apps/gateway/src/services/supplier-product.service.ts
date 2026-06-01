import { Prisma, SupplierProduct } from '@prisma/client';
import { BaseService } from './base.service';
import { ConflictError, NotFoundError } from '../utils/errors';
import {
  validate,
  CreateSupplierProductSchema,
  UpdateSupplierProductSchema,
} from '../utils/validation';
import type { z } from 'zod';

export type CreateSupplierProductInput = z.infer<typeof CreateSupplierProductSchema>;
export type UpdateSupplierProductInput = z.infer<typeof UpdateSupplierProductSchema>;

export type SupplierProductWithSupplyItem = Prisma.SupplierProductGetPayload<{
  include: { supplyItem: true };
}>;

export class SupplierProductService extends BaseService {
  async findBySupplierId(
    tenantId: string,
    supplierId: string,
  ): Promise<SupplierProductWithSupplyItem[]> {
    await this.assertSupplierExists(tenantId, supplierId);

    return this.prisma.supplierProduct.findMany({
      where: { tenantId, supplierId },
      include: { supplyItem: true },
      orderBy: { supplyItem: { nombre: 'asc' } },
    });
  }

  async create(tenantId: string, data: unknown): Promise<SupplierProductWithSupplyItem> {
    const validated = validate(CreateSupplierProductSchema, data);
    await this.assertSupplierExists(tenantId, validated.supplierId);
    await this.assertSupplyItemExists(tenantId, validated.supplyItemId);

    const existing = await this.prisma.supplierProduct.findUnique({
      where: {
        tenantId_supplierId_supplyItemId: {
          tenantId,
          supplierId: validated.supplierId,
          supplyItemId: validated.supplyItemId,
        },
      },
    });
    if (existing) {
      throw new ConflictError('This supply item is already linked to the supplier');
    }

    return this.prisma.supplierProduct.create({
      data: {
        tenantId,
        supplierId: validated.supplierId,
        supplyItemId: validated.supplyItemId,
        precioUnitario: validated.precioUnitario,
        unidadCompra: validated.unidadCompra,
        factorConversion: validated.factorConversion,
        tiempoEntregaDias: validated.tiempoEntregaDias ?? 1,
        esProveedorPrincipal: validated.esProveedorPrincipal ?? false,
      },
      include: { supplyItem: true },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: unknown,
  ): Promise<SupplierProductWithSupplyItem> {
    const validated = validate(UpdateSupplierProductSchema, data);
    const existing = await this.findById(id, tenantId);

    const precioChanged =
      validated.precioUnitario !== undefined &&
      Number(validated.precioUnitario) !== Number(existing.precioUnitario);

    if (precioChanged) {
      return this.prisma.$transaction(async (tx) => {
        const previousPrice = existing.precioUnitario;
        const updated = await tx.supplierProduct.update({
          where: { id },
          data: validated,
          include: { supplyItem: true },
        });

        await tx.supplyItemPriceHistory.create({
          data: {
            tenantId,
            supplyItemId: existing.supplyItemId,
            costoAnterior: previousPrice,
            costoNuevo: validated.precioUnitario!,
            motivo: 'supplier_product_price_update',
            referenciaTipo: 'SupplierProduct',
            referenciaId: id,
          },
        });

        return updated;
      });
    }

    return this.prisma.supplierProduct.update({
      where: { id },
      data: validated,
      include: { supplyItem: true },
    });
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    await this.findById(id, tenantId);
    await this.prisma.supplierProduct.delete({ where: { id } });
    return true;
  }

  async getPreviousPrice(tenantId: string, supplyItemId: string): Promise<number | null> {
    const latest = await this.prisma.supplyItemPriceHistory.findFirst({
      where: { tenantId, supplyItemId },
      orderBy: { createdAt: 'desc' },
    });
    return latest ? Number(latest.costoAnterior) : null;
  }

  private async findById(id: string, tenantId: string): Promise<SupplierProduct> {
    const product = await this.prisma.supplierProduct.findFirst({
      where: { id, tenantId },
    });
    if (!product) throw new NotFoundError('SupplierProduct', id);
    return product;
  }

  private async assertSupplierExists(tenantId: string, supplierId: string): Promise<void> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, tenantId },
    });
    if (!supplier) throw new NotFoundError('Supplier', supplierId);
  }

  private async assertSupplyItemExists(tenantId: string, supplyItemId: string): Promise<void> {
    const item = await this.prisma.supplyItem.findFirst({
      where: { id: supplyItemId, tenantId },
    });
    if (!item) throw new NotFoundError('SupplyItem', supplyItemId);
  }
}
