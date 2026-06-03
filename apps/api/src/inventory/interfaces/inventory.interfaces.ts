import type { Prisma } from '@prisma/client';
import type {
  InventoryAlertDto,
  InventoryAlertSummaryDto,
} from '../controller/dto/inventory-alert.dto';
import type { InventoryDashboardDto } from '../controller/dto/inventory-dashboard.dto';
import type { InventoryReportDto } from '../controller/dto/inventory-report.dto';

const dashboardInclude = {
  categoria: true,
  supplierProducts: {
    where: { esProveedorPrincipal: true },
    include: { supplier: true },
    take: 1,
  },
} satisfies Prisma.SupplyItemInclude;

const alertsInclude = {
  supplierProducts: {
    where: { esProveedorPrincipal: true },
    include: { supplier: true },
    take: 1,
  },
} satisfies Prisma.SupplyItemInclude;

const reportInclude = {
  categoria: true,
} satisfies Prisma.SupplyItemInclude;

export type InventoryDashboardSupplyItem = Prisma.SupplyItemGetPayload<{
  include: typeof dashboardInclude;
}>;

export type InventoryAlertSupplyItem = Prisma.SupplyItemGetPayload<{
  include: typeof alertsInclude;
}>;

export type InventoryReportSupplyItem = Prisma.SupplyItemGetPayload<{
  include: typeof reportInclude;
}>;

export { dashboardInclude, alertsInclude, reportInclude };

export interface IInventoryRepository {
  findActiveForDashboard(tenantId: string): Promise<InventoryDashboardSupplyItem[]>;
  findActiveForAlerts(tenantId: string): Promise<InventoryAlertSupplyItem[]>;
  findActiveForReport(tenantId: string): Promise<InventoryReportSupplyItem[]>;
}

export interface IInventoryService {
  getDashboard(tenantId: string): Promise<InventoryDashboardDto>;
  getAlerts(tenantId: string): Promise<InventoryAlertDto[]>;
  getAlertSummary(alerts: InventoryAlertDto[]): InventoryAlertSummaryDto;
  resolveAlert(alertId: string): void;
  getReport(tenantId: string, type: string): Promise<InventoryReportDto>;
}
