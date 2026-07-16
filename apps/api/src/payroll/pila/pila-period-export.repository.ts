import { Injectable } from '@nestjs/common';
import { PilaExportFormat, PilaPeriodExportStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreatePilaPeriodExportData,
  IPilaPeriodExportRepository,
  ListPilaPeriodExportsFilter,
  PilaPeriodExportRecord,
} from './pila-period-export.interfaces';

@Injectable()
export class PilaPeriodExportRepository implements IPilaPeriodExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMaxVersion(
    tenantId: string,
    periodHealth: string,
    format: PilaExportFormat,
  ): Promise<number> {
    const row = await this.prisma.pilaPeriodExport.findFirst({
      where: { tenantId, periodHealth, format },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return row?.version ?? 0;
  }

  async findActiveByPeriod(
    tenantId: string,
    periodHealth: string,
    format: PilaExportFormat,
  ): Promise<PilaPeriodExportRecord | null> {
    return this.prisma.pilaPeriodExport.findFirst({
      where: {
        tenantId,
        periodHealth,
        format,
        status: { in: [PilaPeriodExportStatus.GENERATED, PilaPeriodExportStatus.PAID] },
      },
    });
  }

  async findActiveByPeriodAnyFormat(
    tenantId: string,
    periodHealth: string,
  ): Promise<PilaPeriodExportRecord[]> {
    return this.prisma.pilaPeriodExport.findMany({
      where: {
        tenantId,
        periodHealth,
        status: { in: [PilaPeriodExportStatus.GENERATED, PilaPeriodExportStatus.PAID] },
      },
      orderBy: [{ format: 'asc' }, { version: 'desc' }],
    });
  }

  async findWithPaymentEvidence(
    tenantId: string,
    periodHealth: string,
  ): Promise<PilaPeriodExportRecord | null> {
    return this.prisma.pilaPeriodExport.findFirst({
      where: {
        tenantId,
        periodHealth,
        paidAt: { not: null },
      },
      orderBy: { version: 'desc' },
    });
  }

  async findById(id: string, tenantId: string): Promise<PilaPeriodExportRecord | null> {
    return this.prisma.pilaPeriodExport.findFirst({
      where: { id, tenantId },
    });
  }

  async list(
    tenantId: string,
    filter: ListPilaPeriodExportsFilter,
  ): Promise<PilaPeriodExportRecord[]> {
    return this.prisma.pilaPeriodExport.findMany({
      where: {
        tenantId,
        ...(filter.periodHealth ? { periodHealth: filter.periodHealth } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.format ? { format: filter.format } : {}),
      },
      orderBy: [{ periodHealth: 'desc' }, { format: 'asc' }, { version: 'desc' }],
    });
  }

  async create(data: CreatePilaPeriodExportData): Promise<PilaPeriodExportRecord> {
    return this.prisma.pilaPeriodExport.create({ data });
  }

  async markVoided(
    id: string,
    tenantId: string,
    data: { voidedAt: Date; voidedBy: string; voidReason: string },
  ): Promise<PilaPeriodExportRecord> {
    void tenantId;
    return this.prisma.pilaPeriodExport.update({
      where: { id },
      data: {
        status: PilaPeriodExportStatus.VOIDED,
        voidedAt: data.voidedAt,
        voidedBy: data.voidedBy,
        voidReason: data.voidReason,
      },
    });
  }

  async markPaid(
    id: string,
    tenantId: string,
    data: {
      paidAt: Date;
      paidConfirmedBy: string;
      planNumber: string;
      paymentReference: string | null;
    },
  ): Promise<PilaPeriodExportRecord> {
    void tenantId;
    return this.prisma.pilaPeriodExport.update({
      where: { id },
      data: {
        status: PilaPeriodExportStatus.PAID,
        paidAt: data.paidAt,
        paidConfirmedBy: data.paidConfirmedBy,
        planNumber: data.planNumber,
        paymentReference: data.paymentReference,
      },
    });
  }

  async markPaidForPeriod(
    tenantId: string,
    periodHealth: string,
    data: {
      paidAt: Date;
      paidConfirmedBy: string;
      planNumber: string;
      paymentReference: string | null;
    },
  ): Promise<PilaPeriodExportRecord[]> {
    await this.prisma.pilaPeriodExport.updateMany({
      where: {
        tenantId,
        periodHealth,
        status: PilaPeriodExportStatus.GENERATED,
      },
      data: {
        status: PilaPeriodExportStatus.PAID,
        paidAt: data.paidAt,
        paidConfirmedBy: data.paidConfirmedBy,
        planNumber: data.planNumber,
        paymentReference: data.paymentReference,
      },
    });
    return this.findActiveByPeriodAnyFormat(tenantId, periodHealth);
  }

  async voidActiveAndCreate(
    activeId: string | null,
    voidMeta: { voidedAt: Date; voidedBy: string; voidReason: string } | null,
    createData: CreatePilaPeriodExportData,
  ): Promise<PilaPeriodExportRecord> {
    return this.prisma.$transaction(async (tx) => {
      if (activeId && voidMeta) {
        await tx.pilaPeriodExport.update({
          where: { id: activeId },
          data: {
            status: PilaPeriodExportStatus.VOIDED,
            voidedAt: voidMeta.voidedAt,
            voidedBy: voidMeta.voidedBy,
            voidReason: voidMeta.voidReason,
          },
        });
      }
      return tx.pilaPeriodExport.create({ data: createData });
    });
  }

  async updateStorageEntityId(storageObjectId: string, entityId: string): Promise<void> {
    await this.prisma.storageObject.update({
      where: { id: storageObjectId },
      data: {
        entityType: 'PilaPeriodExport',
        entityId,
      },
    });
  }
}

export type { Prisma };
