import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  alertsInclude,
  dashboardInclude,
  type IInventoryRepository,
  reportInclude,
} from '../interfaces/inventory.interfaces';

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
}
