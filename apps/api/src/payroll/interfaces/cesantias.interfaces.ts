import type {
  CesantiasFundChannel,
  CesantiasInterestStatus,
  CesantiasSettlementStatus,
  Prisma,
} from '@prisma/client';

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
export type CesantiasLiquidationRecord = {
  id: string;
  tenantId: string;
  employeeId: string;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  accrualDays: number;
  calculationBase: string;
  cesantiasAmount: string;
  interestAmount: string;
  interestRateSnapshot: string;
  fundNameSnapshot: string;
  fundChannelSnapshot: CesantiasFundChannel;
  cesantiasStatus: CesantiasSettlementStatus;
  interestStatus: CesantiasInterestStatus;
  calculatedBy: string | null;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertCesantiasLiquidationData = {
  tenantId: string;
  employeeId: string;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  accrualDays: number;
  calculationBase: Prisma.Decimal;
  cesantiasAmount: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  interestRateSnapshot: Prisma.Decimal;
  fundNameSnapshot: string;
  fundChannelSnapshot: CesantiasFundChannel;
  calculatedBy?: string;
};

export type ListCesantiasLiquidationsFilters = {
  tenantId: string;
  year?: number;
  cesantiasStatus?: CesantiasSettlementStatus;
  interestStatus?: CesantiasInterestStatus;
  limit?: number;
  offset?: number;
};

export interface ICesantiasRepository {
  findMapByTenantAndYear(
    tenantId: string,
    year: number,
  ): Promise<Map<string, CesantiasLiquidationRecord>>;
  findByEmployeeAndYear(
    tenantId: string,
    employeeId: string,
    year: number,
  ): Promise<CesantiasLiquidationRecord | null>;
  /**
   * Crea o actualiza en el mismo registro (upsert por [employeeId, year]). El caller
   * (CesantiasService) decide ANTES de llamar esto si la liquidación existente está en un
   * estado recalculable — este método no lo revalida, siempre escribe.
   */
  upsertCalculationTx(
    tx: Prisma.TransactionClient,
    data: UpsertCesantiasLiquidationData,
  ): Promise<CesantiasLiquidationRecord>;
  /** Envuelve N upsertCalculationTx en una sola transacción — ver implementación. */
  saveCalculations(items: UpsertCesantiasLiquidationData[]): Promise<CesantiasLiquidationRecord[]>;
  findByTenantAndYear(
    filters: ListCesantiasLiquidationsFilters,
  ): Promise<CesantiasLiquidationRecord[]>;
  countByTenantAndYear(filters: ListCesantiasLiquidationsFilters): Promise<number>;
  findById(tenantId: string, id: string): Promise<CesantiasLiquidationRecord | null>;
  /**
   * OS-588 (fase 3) — todas las liquidaciones exportables de un tenant+año, sin paginar
   * (una exportación regulatoria debe incluir todos los registros, no una página). Solo
   * `cesantiasStatus` CALCULADA/CONSIGNADA — ANULADA nunca se exporta. No filtra por
   * `interestStatus`: la exportación de consignación de cesantías no incluye intereses
   * (ver CesantiasExportService), así que ese estado es irrelevante aquí.
   */
  findExportableByTenantAndYear(
    tenantId: string,
    year: number,
  ): Promise<CesantiasLiquidationRecord[]>;
}
