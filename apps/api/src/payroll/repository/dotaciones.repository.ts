import { Injectable } from '@nestjs/common';
import { DotacionStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  DotacionHistoryFilters,
  DotacionPage,
  DotacionPeriodFilters,
  DotacionWithSupplyItem,
  EligibleEmployee,
} from '../interfaces/dotaciones.interfaces';

const DOTACION_CATEGORY_NAME = 'DOTACION';
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class DotacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEligibleEmployees(
    tenantId: string,
    salaryThreshold: number,
  ): Promise<EligibleEmployee[]> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);

    return this.prisma.employeeDetails.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
        hireDate: { lt: cutoffDate },
        salaryAmount: { lte: salaryThreshold },
      },
      select: {
        id: true,
        name: true,
        salaryAmount: true,
        hireDate: true,
        locationId: true,
      },
    });
  }

  async findExistingDeliveries(
    tenantId: string,
    period: string,
    employeeIds: string[],
  ): Promise<{ employeeId: string }[]> {
    return this.prisma.dotacionDelivery.findMany({
      where: {
        tenantId,
        period,
        employeeId: { in: employeeIds },
        deletedAt: null,
      },
      select: { employeeId: true },
    });
  }

  async createManyDeliveries(
    data: Prisma.DotacionDeliveryCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.dotacionDelivery.createMany({ data, skipDuplicates: true });
  }

  async findById(id: string, tenantId: string): Promise<DotacionWithSupplyItem | null> {
    return this.prisma.dotacionDelivery.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { supplyItem: true },
    });
  }

  async findByPeriod(filters: DotacionPeriodFilters): Promise<DotacionPage> {
    const take = (filters.take ?? DEFAULT_PAGE_SIZE) + 1;

    const items = await this.prisma.dotacionDelivery.findMany({
      where: {
        tenantId: filters.tenantId,
        period: filters.period,
        deletedAt: null,
      },
      include: { supplyItem: true },
      take,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    // Filter by location if needed (done in-memory to avoid complex join)
    const filtered = filters.locationId
      ? await this.filterByLocation(items, filters.tenantId, filters.locationId)
      : items;

    const hasNextPage = filtered.length > (filters.take ?? DEFAULT_PAGE_SIZE);
    const edges = hasNextPage ? filtered.slice(0, -1) : filtered;

    return {
      edges,
      pageInfo: { hasNextPage, endCursor: edges.at(-1)?.id ?? null },
    };
  }

  private async filterByLocation(
    items: DotacionWithSupplyItem[],
    tenantId: string,
    locationId: string,
  ): Promise<DotacionWithSupplyItem[]> {
    const employeeIds = items.map((i) => i.employeeId);
    const employees = await this.prisma.employeeDetails.findMany({
      where: { id: { in: employeeIds }, tenantId, locationId },
      select: { id: true },
    });
    const eligible = new Set(employees.map((e) => e.id));
    return items.filter((i) => eligible.has(i.employeeId));
  }

  async findEmployeeHistory(filters: DotacionHistoryFilters): Promise<DotacionPage> {
    const take = (filters.take ?? DEFAULT_PAGE_SIZE) + 1;

    const items = await this.prisma.dotacionDelivery.findMany({
      where: {
        tenantId: filters.tenantId,
        employeeId: filters.employeeId,
        deletedAt: null,
      },
      include: { supplyItem: true },
      take,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = items.length > (filters.take ?? DEFAULT_PAGE_SIZE);
    const edges = hasNextPage ? items.slice(0, -1) : items;

    return {
      edges,
      pageInfo: { hasNextPage, endCursor: edges.at(-1)?.id ?? null },
    };
  }

  async findAvailableSupplyItems(tenantId: string) {
    const category = await this.prisma.supplyCategory.findFirst({
      where: {
        tenantId,
        nombre: { equals: DOTACION_CATEGORY_NAME, mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true },
    });

    if (!category) {
      return [];
    }

    return this.prisma.supplyItem.findMany({
      where: {
        tenantId,
        categoriaId: category.id,
        isActive: true,
        stockActualBodega: { gt: 0 },
      },
      select: {
        id: true,
        nombre: true,
        talla: true,
        genero: true,
        subcategoria: true,
        stockActualBodega: true,
        unidadBase: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findSupplyItemForDelivery(supplyItemId: string, tenantId: string) {
    return this.prisma.supplyItem.findFirst({
      where: { id: supplyItemId, tenantId, isActive: true },
      select: { id: true, nombre: true, stockActualBodega: true, talla: true },
    });
  }

  async registerDeliveryTransaction(
    deliveryId: string,
    supplyItemId: string,
    quantity: number,
    deliveredAt: Date,
    signedReceiptUrl: string | undefined,
    currentStock: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const newStock = currentStock - quantity;

      const movement = await tx.supplyItemPriceHistory.create({
        data: {
          tenantId: (
            await tx.dotacionDelivery.findUniqueOrThrow({
              where: { id: deliveryId },
              select: { tenantId: true },
            })
          ).tenantId,
          supplyItemId,
          costoAnterior: 0,
          costoNuevo: 0,
          cantidadRecibida: -quantity,
          stockAnterior: currentStock,
          stockNuevo: newStock,
          motivo: 'ENTREGA_DOTACION',
          referenciaTipo: 'DotacionDelivery',
          referenciaId: deliveryId,
        },
      });

      await tx.supplyItem.update({
        where: { id: supplyItemId },
        data: { stockActualBodega: { decrement: quantity } },
      });

      return tx.dotacionDelivery.update({
        where: { id: deliveryId },
        data: {
          supplyItemId,
          quantity,
          deliveredAt,
          signedReceiptUrl: signedReceiptUrl ?? null,
          status: DotacionStatus.ENTREGADA,
          stockMovementId: movement.id,
        },
        include: { supplyItem: true },
      });
    });
  }

  async findPendingDeliveriesByPosition(
    tenantId: string,
    period: string,
    positionId: string,
    locationId?: string,
  ) {
    const employees = await this.prisma.employeeDetails.findMany({
      where: {
        tenantId,
        positionId,
        isActive: true,
        deletedAt: null,
        ...(locationId ? { locationId } : {}),
      },
      select: { id: true },
    });

    if (employees.length === 0) {
      return [];
    }

    const employeeIds = employees.map((e) => e.id);

    return this.prisma.dotacionDelivery.findMany({
      where: {
        tenantId,
        period,
        status: DotacionStatus.PENDIENTE,
        employeeId: { in: employeeIds },
        deletedAt: null,
      },
      select: { id: true, tenantId: true },
    });
  }

  async bulkRegisterDeliveriesTransaction(
    deliveries: { id: string; tenantId: string }[],
    supplyItemId: string,
    quantity: number,
    deliveredAt: Date,
    currentStock: number,
    signedReceiptUrl?: string,
  ) {
    const totalQuantity = deliveries.length * quantity;
    const newStock = currentStock - totalQuantity;

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.supplyItemPriceHistory.create({
        data: {
          tenantId: deliveries[0]!.tenantId,
          supplyItemId,
          costoAnterior: 0,
          costoNuevo: 0,
          cantidadRecibida: -totalQuantity,
          stockAnterior: currentStock,
          stockNuevo: newStock,
          motivo: 'ENTREGA_DOTACION_BULK',
          referenciaTipo: 'DotacionBulkByPosition',
          referenciaId: `bulk:${supplyItemId}:${deliveries.length}`,
        },
      });

      await tx.supplyItem.update({
        where: { id: supplyItemId },
        data: { stockActualBodega: { decrement: totalQuantity } },
      });

      await tx.dotacionDelivery.updateMany({
        where: { id: { in: deliveries.map((d) => d.id) } },
        data: {
          supplyItemId,
          quantity,
          deliveredAt,
          signedReceiptUrl: signedReceiptUrl ?? null,
          status: DotacionStatus.ENTREGADA,
          stockMovementId: movement.id,
        },
      });

      return movement.id;
    });
  }

  async markNotApplicable(id: string, tenantId: string, reason?: string) {
    return this.prisma.dotacionDelivery.update({
      where: { id },
      data: {
        status: DotacionStatus.NO_APLICA,
        noAplicaReason: reason ?? null,
      },
      include: { supplyItem: true },
    });
  }

  async findComplianceReport(tenantId: string, period: string, locationId?: string) {
    const deliveries = await this.prisma.dotacionDelivery.findMany({
      where: { tenantId, period, deletedAt: null },
      include: {
        supplyItem: { select: { nombre: true, talla: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const employeeIds = deliveries.map((d) => d.employeeId);
    const employees = await this.prisma.employeeDetails.findMany({
      where: {
        id: { in: employeeIds },
        tenantId,
        ...(locationId ? { locationId } : {}),
      },
      include: { location: { select: { name: true } } },
    });

    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    return deliveries
      .filter((d) => employeeMap.has(d.employeeId))
      .map((d) => {
        const emp = employeeMap.get(d.employeeId)!;
        return {
          employeeId: d.employeeId,
          employeeName: emp.name,
          locationName: emp.location.name,
          period: d.period,
          supplyItemName: d.supplyItem?.nombre ?? null,
          talla: d.supplyItem?.talla ?? null,
          quantity: d.quantity,
          status: d.status,
          deliveredAt: d.deliveredAt,
          signedReceiptUrl: d.signedReceiptUrl,
        };
      });
  }
}
