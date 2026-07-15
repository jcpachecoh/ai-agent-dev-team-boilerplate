import { Injectable } from '@nestjs/common';
import { Prisma, PrimaHalf, PrimaLiquidation } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  IPrimaRepository,
  PrimaLiquidationRecord,
  UpsertPrimaLiquidationData,
} from '../interfaces/prima.interfaces';

@Injectable()
export class PrimaRepository implements IPrimaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmployeeAndPeriod(
    tenantId: string,
    employeeId: string,
    year: number,
    half: PrimaHalf,
  ): Promise<PrimaLiquidationRecord | null> {
    const row = await this.prisma.primaLiquidation.findFirst({
      where: { tenantId, employeeId, year, half },
    });
    return row ? this.map(row) : null;
  }

  async findAllByEmployee(tenantId: string, employeeId: string): Promise<PrimaLiquidationRecord[]> {
    const rows = await this.prisma.primaLiquidation.findMany({
      where: { tenantId, employeeId },
      orderBy: [{ year: 'asc' }, { half: 'asc' }],
    });
    return rows.map((row): PrimaLiquidationRecord => this.map(row));
  }

  async findById(tenantId: string, id: string): Promise<PrimaLiquidationRecord | null> {
    const row = await this.prisma.primaLiquidation.findFirst({ where: { tenantId, id } });
    return row ? this.map(row) : null;
  }

  async upsertCalculationTx(
    tx: Prisma.TransactionClient,
    data: UpsertPrimaLiquidationData,
  ): Promise<PrimaLiquidationRecord> {
    const row = await tx.primaLiquidation.upsert({
      where: {
        employeeId_year_half: { employeeId: data.employeeId, year: data.year, half: data.half },
      },
      update: {
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        accrualDays: data.accrualDays,
        calculationBase: data.calculationBase,
        accruedAmount: data.accruedAmount,
        divisorSnapshot: data.divisorSnapshot,
        // Un recálculo siempre vuelve a CALCULADA — el caller (PrimaService) solo llega
        // aquí cuando ya confirmó que el registro existente no estaba en PAGADA (mismo
        // criterio que CesantiasRepository.upsertCalculationTx).
        status: 'CALCULADA',
        calculatedBy: data.calculatedBy ?? null,
        calculatedAt: new Date(),
      },
      create: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        year: data.year,
        half: data.half,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        accrualDays: data.accrualDays,
        calculationBase: data.calculationBase,
        accruedAmount: data.accruedAmount,
        divisorSnapshot: data.divisorSnapshot,
        calculatedBy: data.calculatedBy ?? null,
      },
    });
    return this.map(row);
  }

  async registerPaymentTx(
    tx: Prisma.TransactionClient,
    id: string,
    amount: Prisma.Decimal,
    nextStatus: PrimaLiquidation['status'],
  ): Promise<PrimaLiquidationRecord> {
    const row = await tx.primaLiquidation.update({
      where: { id },
      data: {
        paidAmount: { increment: amount },
        status: nextStatus,
      },
    });
    return this.map(row);
  }

  async annulTx(tx: Prisma.TransactionClient, id: string): Promise<PrimaLiquidationRecord> {
    const row = await tx.primaLiquidation.update({
      where: { id },
      data: { status: 'ANULADA' },
    });
    return this.map(row);
  }

  private map(row: PrimaLiquidation): PrimaLiquidationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      year: row.year,
      half: row.half,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      accrualDays: row.accrualDays,
      calculationBase: row.calculationBase.toString(),
      accruedAmount: row.accruedAmount.toString(),
      paidAmount: row.paidAmount.toString(),
      divisorSnapshot: row.divisorSnapshot.toString(),
      status: row.status,
      calculatedBy: row.calculatedBy,
      calculatedAt: row.calculatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
