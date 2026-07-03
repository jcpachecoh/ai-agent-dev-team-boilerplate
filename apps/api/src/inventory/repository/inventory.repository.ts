import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  alertsInclude,
  dashboardInclude,
  type IInventoryRepository,
  type ResolveAlertInput,
  reportInclude,
  resolvedAlertsInclude,
} from '../interfaces/inventory.interfaces';

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveForDashboard(tenantId: string) {
    return this.prisma.supplyItem.findMany({
      where: { tenantId, isActive: true },
      include: dashboardInclude,
    });
  }

  findActiveForAlerts(tenantId: string) {
    return this.prisma.supplyItem.findMany({
      where: { tenantId, isActive: true },
      include: alertsInclude,
    });
  }

  findActiveForReport(tenantId: string) {
    return this.prisma.supplyItem.findMany({
      where: { tenantId, isActive: true },
      include: reportInclude,
    });
  }

  async createAlertResolution(input: ResolveAlertInput) {
    const item = await this.prisma.supplyItem.findFirst({
      where: { id: input.supplyItemId, tenantId: input.tenantId, isActive: true },
    });
    if (!item) return null;

    return this.prisma.inventoryAlertResolution.create({
      data: {
        tenantId: input.tenantId,
        supplyItemId: input.supplyItemId,
        resolvedById: input.resolvedById,
        note: input.note,
      },
      include: resolvedAlertsInclude,
    });
  }

  async findResolvedAlerts(tenantId: string, cursor?: string, take = DEFAULT_PAGE_SIZE) {
    const rows = await this.prisma.inventoryAlertResolution.findMany({
      where: { tenantId },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { resolvedAt: 'desc' },
      include: resolvedAlertsInclude,
    });

    const hasNextPage = rows.length > take;
    const edges = hasNextPage ? rows.slice(0, -1) : rows;
    const endCursor = edges.at(-1)?.id ?? null;

    return { edges, hasNextPage, endCursor };
  }

  async countResolvedToday(tenantId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.inventoryAlertResolution.count({
      where: { tenantId, resolvedAt: { gte: startOfDay } },
    });
  }
}
