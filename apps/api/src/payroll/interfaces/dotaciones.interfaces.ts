import { DotacionDelivery, DotacionStatus, SupplyItem } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface GenerateEntitlementsResult {
  processed: number;
  created: number;
  skipped: number;
}

export interface RegisterDotacionDeliveryData {
  dotacionDeliveryId: string;
  supplyItemId: string;
  quantity: number;
  deliveredAt: Date;
  signedReceiptUrl?: string;
}

export interface MarkNotApplicableData {
  id: string;
  tenantId: string;
  reason?: string;
}

export interface DotacionPeriodFilters {
  tenantId: string;
  period: string;
  locationId?: string;
  cursor?: string;
  take?: number;
}

export interface DotacionHistoryFilters {
  employeeId: string;
  tenantId: string;
  cursor?: string;
  take?: number;
}

export interface DotacionWithSupplyItem extends DotacionDelivery {
  supplyItem: SupplyItem | null;
}

export interface DotacionPage {
  edges: DotacionWithSupplyItem[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

export interface EligibleEmployee {
  id: string;
  name: string;
  salaryAmount: Decimal;
  hireDate: Date;
  locationId: string;
}

export interface ComplianceReportRow {
  employeeId: string;
  employeeName: string;
  locationName: string;
  period: string;
  supplyItemName: string | null;
  talla: string | null;
  quantity: number;
  status: DotacionStatus;
  deliveredAt: Date | null;
  signedReceiptUrl: string | null;
}
