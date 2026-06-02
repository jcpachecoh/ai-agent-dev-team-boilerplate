import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplierProduct, Prisma } from '@prisma/client';
import type {
  ISupplierProductRepository,
  SupplierProductWithSupplyItem,
  CreateSupplierProductInput,
  UpdateSupplierProductInput,
} from '../interfaces/supplier-product.interfaces';

@Injectable()
export class SupplierProductRepository implements ISupplierProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySupplierId(
    tenantId: string,
    supplierId: string,
  ): Promise<SupplierProductWithSupplyItem[]> {
    return this.prisma.supplierProduct.findMany({
      where: { tenantId, supplierId },
      include: { supplyItem: true },
      orderBy: { supplyItem: { nombre: 'asc' } },
    });
  }

  async findById(id: string, tenantId: string): Promise<SupplierProduct | null> {
    return this.prisma.supplierProduct.findFirst({ where: { id, tenantId } });
  }

  async findExisting(
    tenantId: string,
    supplierId: string,
    supplyItemId: string,
  ): Promise<SupplierProduct | null> {
    return this.prisma.supplierProduct.findUnique({
      where: { tenantId_supplierId_supplyItemId: { tenantId, supplierId, supplyItemId } },
    });
  }

  async create(
    tenantId: string,
    data: CreateSupplierProductInput,
  ): Promise<SupplierProductWithSupplyItem> {
    return this.prisma.supplierProduct.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        supplyItemId: data.supplyItemId,
        precioUnitario: data.precioUnitario,
        unidadCompra: data.unidadCompra as any,
        factorConversion: data.factorConversion,
        tiempoEntregaDias: data.tiempoEntregaDias ?? 1,
        esProveedorPrincipal: data.esProveedorPrincipal ?? false,
      },
      include: { supplyItem: true },
    });
  }

  async updateWithPriceHistory(
    id: string,
    tenantId: string,
    existing: SupplierProduct,
    data: UpdateSupplierProductInput,
  ): Promise<SupplierProductWithSupplyItem> {
    return this.prisma.$transaction(async (tx) => {
      const previousPrice = existing.precioUnitario;
      const updated = await tx.supplierProduct.update({
        where: { id },
        data: data as Prisma.SupplierProductUpdateInput,
        include: { supplyItem: true },
      });

      await tx.supplyItemPriceHistory.create({
        data: {
          tenantId,
          supplyItemId: existing.supplyItemId,
          costoAnterior: previousPrice,
          costoNuevo: data.precioUnitario!,
          motivo: 'supplier_product_price_update',
          referenciaTipo: 'SupplierProduct',
          referenciaId: id,
        },
      });

      return updated;
    });
  }

  async update(
    id: string,
    data: Prisma.SupplierProductUpdateInput,
  ): Promise<SupplierProductWithSupplyItem> {
    return this.prisma.supplierProduct.update({
      where: { id },
      data,
      include: { supplyItem: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.supplierProduct.delete({ where: { id } });
  }

  async getPreviousPrice(tenantId: string, supplyItemId: string): Promise<number | null> {
    const latest = await this.prisma.supplyItemPriceHistory.findFirst({
      where: { tenantId, supplyItemId },
      orderBy: { createdAt: 'desc' },
    });
    return latest ? Number(latest.costoAnterior) : null;
  }

  async assertSupplierExists(tenantId: string, supplierId: string): Promise<boolean> {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, tenantId } });
    return !!supplier;
  }

  async assertSupplyItemExists(tenantId: string, supplyItemId: string): Promise<boolean> {
    const item = await this.prisma.supplyItem.findFirst({ where: { id: supplyItemId, tenantId } });
    return !!item;
  }
}
