import { Injectable } from '@nestjs/common';
import type { SupplyItem, SupplyItemPriceHistory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ISupplyitemsRepository,
  CreateSupplyItemData,
  UpdateSupplyItemData,
  SupplierWithProductInfo,
} from '../interfaces/supplyitems.interfaces';

@Injectable()
export class SupplyItemsRepository implements ISupplyitemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<SupplyItem[]> {
    return this.prisma.supplyItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(tenantId: string, id: string): Promise<SupplyItem | null> {
    return this.prisma.supplyItem.findFirst({
      where: { id, tenantId },
    });
  }

  findByCodigo(tenantId: string, codigo: string): Promise<SupplyItem | null> {
    return this.prisma.supplyItem.findFirst({
      where: { tenantId, codigoInterno: codigo },
    });
  }

  create(data: CreateSupplyItemData): Promise<SupplyItem> {
    return this.prisma.supplyItem.create({
      data,
    });
  }

  update(tenantId: string, id: string, data: UpdateSupplyItemData): Promise<SupplyItem> {
    return this.prisma.supplyItem.update({
      where: { id, tenantId },
      data,
    });
  }

  delete(tenantId: string, id: string): Promise<SupplyItem> {
    return this.prisma.supplyItem.delete({
      where: { id, tenantId },
    });
  }

  findCategoryById(tenantId: string, id: string): Promise<{ id: string } | null> {
    return this.prisma.supplyCategory.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
  }

  async findSuppliers(tenantId: string, id: string): Promise<SupplierWithProductInfo[]> {
    const relations = await this.prisma.supplierProduct.findMany({
      where: {
        tenantId,
        supplyItemId: id,
      },
      include: {
        supplier: true,
      },
    });

    return relations.map((rel) => ({
      supplierId: rel.supplierId,
      razonSocial: rel.supplier.razonSocial,
      nit: rel.supplier.nit,
      precioUnitario: rel.precioUnitario,
      unidadCompra: rel.unidadCompra,
      factorConversion: rel.factorConversion,
      tiempoEntregaDias: rel.tiempoEntregaDias,
      esProveedorPrincipal: rel.esProveedorPrincipal,
    }));
  }

  findPriceHistory(tenantId: string, supplyItemId: string): Promise<SupplyItemPriceHistory[]> {
    return this.prisma.supplyItemPriceHistory.findMany({
      where: {
        tenantId,
        supplyItemId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateCppWithHistory(
    tenantId: string,
    id: string,
    data: {
      newCpp: any;
      history: any;
    },
  ): Promise<SupplyItem> {
    const [updatedItem] = await this.prisma.$transaction([
      this.prisma.supplyItem.update({
        where: { id, tenantId },
        data: { costoPromedioPonderado: data.newCpp },
      }),
      this.prisma.supplyItemPriceHistory.create({
        data: {
          ...data.history,
          tenantId,
          supplyItemId: id,
        },
      }),
    ]);

    return updatedItem;
  }
}
