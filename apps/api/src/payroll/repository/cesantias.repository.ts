import { Injectable } from '@nestjs/common';
import { CesantiasLiquidation, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CesantiasLiquidationRecord,
  ICesantiasRepository,
  ListCesantiasLiquidationsFilters,
  UpsertCesantiasLiquidationData,
} from '../interfaces/cesantias.interfaces';

@Injectable()
export class CesantiasRepository implements ICesantiasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * OS-588 (fase 2) — todas las liquidaciones de un tenant+año, sin paginar, indexadas por
   * employeeId. Uso interno de CesantiasService.calculateForYear para decidir en memoria
   * (antes de abrir la transacción de escritura) qué empleados ya tienen una liquidación
   * cerrada (CONSIGNADA/PAGADO) y deben saltarse — una sola query en vez de N.
   */
  async findMapByTenantAndYear(
    tenantId: string,
    year: number,
  ): Promise<Map<string, CesantiasLiquidationRecord>> {
    const rows = await this.prisma.cesantiasLiquidation.findMany({ where: { tenantId, year } });
    return new Map(
      rows.map((row): [string, CesantiasLiquidationRecord] => [row.employeeId, this.map(row)]),
    );
  }

  async findByEmployeeAndYear(
    tenantId: string,
    employeeId: string,
    year: number,
  ): Promise<CesantiasLiquidationRecord | null> {
    const row = await this.prisma.cesantiasLiquidation.findFirst({
      where: { tenantId, employeeId, year },
    });
    return row ? this.map(row) : null;
  }

  async upsertCalculationTx(
    tx: Prisma.TransactionClient,
    data: UpsertCesantiasLiquidationData,
  ): Promise<CesantiasLiquidationRecord> {
    const row = await tx.cesantiasLiquidation.upsert({
      where: { employeeId_year: { employeeId: data.employeeId, year: data.year } },
      update: {
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        accrualDays: data.accrualDays,
        calculationBase: data.calculationBase,
        cesantiasAmount: data.cesantiasAmount,
        interestAmount: data.interestAmount,
        interestRateSnapshot: data.interestRateSnapshot,
        fundNameSnapshot: data.fundNameSnapshot,
        fundChannelSnapshot: data.fundChannelSnapshot,
        // Un recálculo siempre vuelve a dejar ambos estados en el punto de partida
        // (CALCULADA/CALCULADO) — el caller (CesantiasService) solo llega aquí cuando ya
        // confirmó que ninguno de los dos estaba cerrado (CONSIGNADA/PAGADO), así que
        // "resetear" a CALCULADA/CALCULADO es correcto incluso si venía de ANULADA/ANULADO.
        cesantiasStatus: 'CALCULADA',
        interestStatus: 'CALCULADO',
        calculatedBy: data.calculatedBy ?? null,
        calculatedAt: new Date(),
      },
      create: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        year: data.year,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        accrualDays: data.accrualDays,
        calculationBase: data.calculationBase,
        cesantiasAmount: data.cesantiasAmount,
        interestAmount: data.interestAmount,
        interestRateSnapshot: data.interestRateSnapshot,
        fundNameSnapshot: data.fundNameSnapshot,
        fundChannelSnapshot: data.fundChannelSnapshot,
        calculatedBy: data.calculatedBy ?? null,
      },
    });
    return this.map(row);
  }

  /**
   * OS-588 (fase 2) — persiste el lote completo de un `calculateForYear` en una sola
   * transacción: o se guardan todas las liquidaciones calculadas en esta corrida, o
   * ninguna (si una falla a mitad de camino, p.ej. por un CHECK constraint futuro o un
   * error de datos, las anteriores del mismo lote también se revierten). El caller
   * (CesantiasService) ya filtró antes de llamar esto — aquí solo se escribe, sin
   * lecturas ni cálculos adicionales dentro de la transacción.
   */
  async saveCalculations(
    items: UpsertCesantiasLiquidationData[],
  ): Promise<CesantiasLiquidationRecord[]> {
    if (items.length === 0) {
      return [];
    }
    return this.prisma.$transaction(async (tx): Promise<CesantiasLiquidationRecord[]> => {
      const results: CesantiasLiquidationRecord[] = [];
      for (const item of items) {
        results.push(await this.upsertCalculationTx(tx, item));
      }
      return results;
    });
  }

  async findByTenantAndYear(
    filters: ListCesantiasLiquidationsFilters,
  ): Promise<CesantiasLiquidationRecord[]> {
    const rows = await this.prisma.cesantiasLiquidation.findMany({
      where: this.buildWhere(filters),
      orderBy: { employeeId: 'asc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    });
    return rows.map((row): CesantiasLiquidationRecord => this.map(row));
  }

  async countByTenantAndYear(filters: ListCesantiasLiquidationsFilters): Promise<number> {
    return this.prisma.cesantiasLiquidation.count({ where: this.buildWhere(filters) });
  }

  async findById(tenantId: string, id: string): Promise<CesantiasLiquidationRecord | null> {
    const row = await this.prisma.cesantiasLiquidation.findFirst({ where: { tenantId, id } });
    return row ? this.map(row) : null;
  }

  private buildWhere(
    filters: ListCesantiasLiquidationsFilters,
  ): Prisma.CesantiasLiquidationWhereInput {
    return {
      tenantId: filters.tenantId,
      ...(filters.year !== undefined ? { year: filters.year } : {}),
      ...(filters.cesantiasStatus ? { cesantiasStatus: filters.cesantiasStatus } : {}),
      ...(filters.interestStatus ? { interestStatus: filters.interestStatus } : {}),
    };
  }

  private map(row: CesantiasLiquidation): CesantiasLiquidationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      year: row.year,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      accrualDays: row.accrualDays,
      calculationBase: row.calculationBase.toString(),
      cesantiasAmount: row.cesantiasAmount.toString(),
      interestAmount: row.interestAmount.toString(),
      interestRateSnapshot: row.interestRateSnapshot.toString(),
      fundNameSnapshot: row.fundNameSnapshot,
      fundChannelSnapshot: row.fundChannelSnapshot,
      cesantiasStatus: row.cesantiasStatus,
      interestStatus: row.interestStatus,
      calculatedBy: row.calculatedBy,
      calculatedAt: row.calculatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
