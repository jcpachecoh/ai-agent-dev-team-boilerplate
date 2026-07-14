import type {
  CesantiasFundChannel,
  CesantiasInterestStatus,
  CesantiasSettlementStatus,
  Prisma,
} from '@prisma/client';

/**
 * OS-588 (fase 4, revisión previa a commit) — única fuente de verdad de qué estados de
 * `cesantiasStatus` son exportables (usados para armar los archivos de consignación).
 * `CesantiasRepository.findExportableByTenantAndYear` (fase 3) y
 * `countExportableByTenantYearAndChannel` (fase 4, botones de descarga del frontend)
 * importan esta misma constante — así la regla de habilitación de los botones de
 * descarga en el frontend nunca puede quedar desincronizada del backend: el frontend no
 * duplica la lista de estados, solo consume el conteo que ya la aplicó server-side.
 */
export const EXPORTABLE_CESANTIAS_STATUSES: readonly CesantiasSettlementStatus[] = [
  'CALCULADA',
  'CONSIGNADA',
];

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

/**
 * OS-588 (fase 4) — usado solo por CesantiasService.listByYear, para que la pantalla de
 * frontend nunca tenga que mostrar `employeeId` técnico en la tabla (requisito explícito
 * de UX). `employeeName` se resuelve en batch vía PayrollRepository, no en el frontend.
 */
export type CesantiasLiquidationSummary = CesantiasLiquidationRecord & {
  employeeName: string;
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
  fundChannelSnapshot?: CesantiasFundChannel;
  fundNameSnapshot?: string;
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
  /**
   * OS-588 (fase 4) — cuenta liquidaciones aún no consignadas (`cesantiasStatus =
   * CALCULADA`) de un tenant+año, para la alerta de vencimiento. No distingue
   * `interestStatus` — el vencimiento legal es sobre la consignación de cesantías, no
   * sobre el pago de intereses (mismo criterio que la exportación, ver
   * tasks/OS-588.md §27).
   */
  countPendingByTenantAndYear(tenantId: string, year: number): Promise<number>;
  /**
   * OS-588 (fase 4, revisión previa a commit) — cuenta liquidaciones de un
   * tenant+año+canal que están en un estado EXPORTABLE (`EXPORTABLE_CESANTIAS_STATUSES`
   * — hoy CALCULADA/CONSIGNADA, nunca ANULADA). Usado por
   * `CesantiasService.getExportAvailability` para decirle al frontend si debe habilitar
   * el botón de descarga de cada canal — la misma regla que usa
   * `findExportableByTenantAndYear` para decidir qué se incluye en el archivo.
   */
  countExportableByTenantYearAndChannel(
    tenantId: string,
    year: number,
    fundChannelSnapshot: CesantiasFundChannel,
  ): Promise<number>;
}
