import { Injectable } from '@nestjs/common';
import { PendingSalaryReconciliation, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePendingSalaryReconciliationData,
  IPendingSalaryReconciliationRepository,
  PendingSalaryReconciliationRecord,
} from '../interfaces/pending-salary-reconciliation.interfaces';

/**
 * OS-591 (fase 3) — Persistencia de reconciliaciones auditables de salario pendiente.
 * Ver tasks/OS-591.md §15.2. Solo un registro por liquidación (`@@unique([settlementId])`)
 * — nunca se actualiza, solo se crea.
 */
@Injectable()
export class PendingSalaryReconciliationRepository implements IPendingSalaryReconciliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySettlement(
    tenantId: string,
    settlementId: string,
  ): Promise<PendingSalaryReconciliationRecord | null> {
    const row = await this.prisma.pendingSalaryReconciliation.findFirst({
      where: { tenantId, settlementId },
    });
    return row ? this.map(row) : null;
  }

  async create(
    data: CreatePendingSalaryReconciliationData,
  ): Promise<PendingSalaryReconciliationRecord> {
    const row = await this.prisma.pendingSalaryReconciliation.create({
      data: {
        tenantId: data.tenantId,
        settlementId: data.settlementId,
        previouslyPaidAmount: new Prisma.Decimal(data.previouslyPaidAmount),
        paymentReference: data.paymentReference ?? null,
        paymentDate: data.paymentDate ?? null,
        responsible: data.responsible,
        observation: data.observation,
        recognizedBalance: new Prisma.Decimal(data.recognizedBalance),
        createdBy: data.createdBy ?? null,
      },
    });
    return this.map(row);
  }

  private map(row: PendingSalaryReconciliation): PendingSalaryReconciliationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      settlementId: row.settlementId,
      previouslyPaidAmount: row.previouslyPaidAmount.toFixed(2),
      paymentReference: row.paymentReference,
      paymentDate: row.paymentDate,
      responsible: row.responsible,
      observation: row.observation,
      recognizedBalance: row.recognizedBalance.toFixed(2),
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  }
}
