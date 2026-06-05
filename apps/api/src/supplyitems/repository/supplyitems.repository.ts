import { Injectable } from '@nestjs/common';
import type { SupplyItem, SupplyItemPriceHistory } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber } from '../../common/utils/decimal.util';
import type {
  CreateSupplyItemData,
  FindSupplyItemsOptions,
  ISupplyitemsRepository,
  SupplyItemSupplierRow,
  UpdateSupplyItemData,
} from '../interfaces/supplyitems.interfaces';
import type { SupplyItemWithRelations } from '../mapper/supply-item.mapper';

const itemInclude = {
  categoria: true,
  supplierProducts: {
    include: { supplier: true },
    orderBy: { esProveedorPrincipal: 'desc' as const },
  },
} satisfies Prisma.SupplyItemInclude;

@Injectable()
export class SupplyItemsRepository implements ISupplyitemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(tenantId: string, id: string): Promise<SupplyItem | null> {
    return this.prisma.supplyItem.findFirst({
      where: { id, tenantId },
    });
  }

  findOneDetailed(tenantId: string, id: string): Promise<SupplyItemWithRelations | null> {
    return this.prisma.supplyItem.findFirst({
      where: { id, tenantId },
      include: itemInclude,
    });
  }

  findAll(
    tenantId: string,
    options: FindSupplyItemsOptions = {},
  ): Promise<SupplyItemWithRelations[]> {
    const take = Math.min(Math.max(1, options.limit ?? 50), 100);
    const skip = Math.max(0, options.offset ?? 0);

    const where: Prisma.SupplyItemWhereInput = {
      tenantId,
      ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
      ...(options.categoriaId ? { categoriaId: options.categoriaId } : {}),
      ...(options.codigoInterno
        ? { codigoInterno: { equals: options.codigoInterno, mode: 'insensitive' } }
        : {}),
      ...(options.search
        ? {
            OR: [
              { nombre: { contains: options.search, mode: 'insensitive' } },
              { codigoInterno: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.supplyItem.findMany({
      where,
      take,
      skip,
      orderBy: { nombre: 'asc' },
      include: itemInclude,
    });
  }

  findByCodigoInterno(tenantId: string, codigoInterno: string): Promise<SupplyItem | null> {
    return this.prisma.supplyItem.findFirst({
      where: { tenantId, codigoInterno: { equals: codigoInterno, mode: 'insensitive' } },
    });
  }

  async create(tenantId: string, data: CreateSupplyItemData): Promise<SupplyItemWithRelations> {
    return this.prisma.supplyItem.create({
      data: {
        tenantId,
        nombre: data.nombre,
        codigoInterno: data.codigoInterno,
        categoriaId: data.categoriaId,
        descripcion: data.descripcion,
        unidadBase: data.unidadBase,
        factorConversion: data.factorConversion,
        costoPromedioPonderado: data.costoPromedioPonderado ?? '0',
        stockMinimoBodega: data.stockMinimoBodega,
        stockMaximoBodega: data.stockMaximoBodega,
        stockActualBodega: data.stockActualBodega ?? '0',
        aplicaVencimiento: data.aplicaVencimiento ?? false,
        aplicaLote: data.aplicaLote ?? false,
        isActive: data.isActive ?? true,
      },
      include: itemInclude,
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateSupplyItemData,
  ): Promise<SupplyItemWithRelations> {
    return this.prisma.supplyItem.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.codigoInterno !== undefined ? { codigoInterno: data.codigoInterno } : {}),
        ...(data.categoriaId !== undefined ? { categoriaId: data.categoriaId } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
        ...(data.unidadBase !== undefined ? { unidadBase: data.unidadBase } : {}),
        ...(data.factorConversion !== undefined ? { factorConversion: data.factorConversion } : {}),
        ...(data.costoPromedioPonderado !== undefined
          ? { costoPromedioPonderado: data.costoPromedioPonderado }
          : {}),
        ...(data.stockMinimoBodega !== undefined
          ? { stockMinimoBodega: data.stockMinimoBodega }
          : {}),
        ...(data.stockMaximoBodega !== undefined
          ? { stockMaximoBodega: data.stockMaximoBodega }
          : {}),
        ...(data.stockActualBodega !== undefined
          ? { stockActualBodega: data.stockActualBodega }
          : {}),
        ...(data.aplicaVencimiento !== undefined
          ? { aplicaVencimiento: data.aplicaVencimiento }
          : {}),
        ...(data.aplicaLote !== undefined ? { aplicaLote: data.aplicaLote } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: itemInclude,
    });
  }

  async findSuppliersForItem(
    tenantId: string,
    supplyItemId: string,
  ): Promise<SupplyItemSupplierRow[]> {
    const rows = await this.prisma.supplierProduct.findMany({
      where: { tenantId, supplyItemId },
      include: { supplier: true },
      orderBy: [{ esProveedorPrincipal: 'desc' }, { supplier: { razonSocial: 'asc' } }],
    });

    return rows.map((row) => ({
      supplierId: row.supplierId,
      razonSocial: row.supplier.razonSocial,
      nit: row.supplier.nit,
      precioUnitario: decimalToNumber(row.precioUnitario),
      unidadCompra: row.unidadCompra,
      factorConversion: decimalToNumber(row.factorConversion),
      tiempoEntregaDias: row.tiempoEntregaDias,
      esProveedorPrincipal: row.esProveedorPrincipal,
    }));
  }

  findPriceHistory(
    tenantId: string,
    supplyItemId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<SupplyItemPriceHistory[]> {
    const take = Math.min(Math.max(1, options.limit ?? 50), 100);
    const skip = Math.max(0, options.offset ?? 0);

    return this.prisma.supplyItemPriceHistory.findMany({
      where: { tenantId, supplyItemId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  categoryExists(tenantId: string, categoriaId: string): Promise<boolean> {
    return this.prisma.supplyCategory
      .findFirst({ where: { id: categoriaId, tenantId } })
      .then((row) => !!row);
  }
}
