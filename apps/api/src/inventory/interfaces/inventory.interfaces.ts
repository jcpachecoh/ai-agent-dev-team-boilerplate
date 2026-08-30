import type { Prisma } from '@prisma/client';
import type {
  InventoryAlertDto,
  InventoryAlertSummaryDto,
  InventoryResolvedAlertDto,
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

const resolvedAlertsInclude = {
  supplyItem: {
    include: {
      supplierProducts: {
        where: { esProveedorPrincipal: true },
        include: { supplier: true },
        take: 1,
      },
    },
  },
} satisfies Prisma.InventoryAlertResolutionInclude;

export type InventoryDashboardSupplyItem = Prisma.SupplyItemGetPayload<{
  include: typeof dashboardInclude;
}>;

export type InventoryAlertSupplyItem = Prisma.SupplyItemGetPayload<{
  include: typeof alertsInclude;
}>;

export type InventoryReportSupplyItem = Prisma.SupplyItemGetPayload<{
  include: typeof reportInclude;
}>;

export type InventoryAlertResolutionWithItem = Prisma.InventoryAlertResolutionGetPayload<{
  include: typeof resolvedAlertsInclude;
}>;

export { dashboardInclude, alertsInclude, reportInclude, resolvedAlertsInclude };

export interface ResolveAlertInput {
  supplyItemId: string;
  tenantId: string;
  resolvedById?: string;
  note?: string;
}

export interface IInventoryRepository {
  findActiveForDashboard(tenantId: string): Promise<InventoryDashboardSupplyItem[]>;
  findActiveForAlerts(tenantId: string): Promise<InventoryAlertSupplyItem[]>;
  findActiveForReport(tenantId: string): Promise<InventoryReportSupplyItem[]>;
  createAlertResolution(input: ResolveAlertInput): Promise<InventoryAlertResolutionWithItem | null>;
  findResolvedAlerts(
    tenantId: string,
    cursor?: string,
    take?: number,
  ): Promise<{ edges: InventoryAlertResolutionWithItem[]; hasNextPage: boolean; endCursor: string | null }>;
  countResolvedToday(tenantId: string): Promise<number>;
}

export interface IInventoryService {
  getDashboard(tenantId: string): Promise<InventoryDashboardDto>;
  getAlerts(tenantId: string): Promise<InventoryAlertDto[]>;
  getAlertSummary(alerts: InventoryAlertDto[], tenantId: string): Promise<InventoryAlertSummaryDto>;
  resolveAlert(alertId: string, tenantId: string, resolvedById?: string, note?: string): Promise<void>;
  getResolvedAlerts(
    tenantId: string,
    cursor?: string,
    take?: number,
  ): Promise<InventoryResolvedAlertDto[]>;
  getReport(tenantId: string, type: string): Promise<InventoryReportDto>;
}
