import type {
  PilaExportFormat,
  PilaPeriodExport,
  PilaPeriodExportStatus,
  Prisma,
} from '@prisma/client';

export const PILA_PERIOD_EXPORT_ENTITY = 'PilaPeriodExport';

export type PilaPeriodExportRecord = PilaPeriodExport;

export type CreatePilaPeriodExportData = {
  tenantId: string;
  periodHealth: string;
  periodOther: string;
  format: PilaExportFormat;
  status: PilaPeriodExportStatus;
  version: number;
  technicalVersion: string;
  fileName: string;
  fileChecksum: string;
  employeeCount: number;
  totalPayrollAmount: number;
  totalContribution: number;
  snapshotJson: Prisma.InputJsonValue;
  storageObjectId: string;
  generatedAt: Date;
  generatedBy: string;
};

export type ListPilaPeriodExportsFilter = {
  periodHealth?: string;
  status?: PilaPeriodExportStatus;
  format?: PilaExportFormat;
};

export interface IPilaPeriodExportRepository {
  findMaxVersion(tenantId: string, periodHealth: string, format: PilaExportFormat): Promise<number>;
  findActiveByPeriod(
    tenantId: string,
    periodHealth: string,
    format: PilaExportFormat,
  ): Promise<PilaPeriodExportRecord | null>;
  findActiveByPeriodAnyFormat(
    tenantId: string,
    periodHealth: string,
  ): Promise<PilaPeriodExportRecord[]>;
  findWithPaymentEvidence(
    tenantId: string,
    periodHealth: string,
  ): Promise<PilaPeriodExportRecord | null>;
  findById(id: string, tenantId: string): Promise<PilaPeriodExportRecord | null>;
  list(tenantId: string, filter: ListPilaPeriodExportsFilter): Promise<PilaPeriodExportRecord[]>;
  create(data: CreatePilaPeriodExportData): Promise<PilaPeriodExportRecord>;
  markVoided(
    id: string,
    tenantId: string,
    data: { voidedAt: Date; voidedBy: string; voidReason: string },
  ): Promise<PilaPeriodExportRecord>;
  markPaid(
    id: string,
    tenantId: string,
    data: {
      paidAt: Date;
      paidConfirmedBy: string;
      planNumber: string;
      paymentReference: string | null;
    },
  ): Promise<PilaPeriodExportRecord>;
  /**
   * Pago por período: marca PAID todas las exportaciones activas (GENERATED) del período
   * con la misma evidencia (una sola fuente de verdad de pago).
   */
  markPaidForPeriod(
    tenantId: string,
    periodHealth: string,
    data: {
      paidAt: Date;
      paidConfirmedBy: string;
      planNumber: string;
      paymentReference: string | null;
    },
  ): Promise<PilaPeriodExportRecord[]>;
  voidActiveAndCreate(
    activeId: string | null,
    voidMeta: { voidedAt: Date; voidedBy: string; voidReason: string } | null,
    createData: CreatePilaPeriodExportData,
  ): Promise<PilaPeriodExportRecord>;
  updateStorageEntityId(storageObjectId: string, entityId: string): Promise<void>;
}
