import type { PrimaHalf, PrimaSettlementStatus, Prisma } from '@prisma/client';

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
export type PrimaLiquidationRecord = {
  id: string;
  tenantId: string;
  employeeId: string;
  year: number;
  half: PrimaHalf;
  periodStart: Date;
  periodEnd: Date;
  accrualDays: number;
  calculationBase: string;
  accruedAmount: string;
  paidAmount: string;
  divisorSnapshot: string;
  status: PrimaSettlementStatus;
  calculatedBy: string | null;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertPrimaLiquidationData = {
  tenantId: string;
  employeeId: string;
  year: number;
  half: PrimaHalf;
  periodStart: Date;
  periodEnd: Date;
  accrualDays: number;
  calculationBase: Prisma.Decimal;
  accruedAmount: Prisma.Decimal;
  divisorSnapshot: Prisma.Decimal;
  calculatedBy?: string;
};

export interface IPrimaRepository {
  findByEmployeeAndPeriod(
    tenantId: string,
    employeeId: string,
    year: number,
    half: PrimaHalf,
  ): Promise<PrimaLiquidationRecord | null>;
  /** Todas las liquidaciones (cualquier año/semestre/estado) de un empleado — sin paginar. */
  findAllByEmployee(tenantId: string, employeeId: string): Promise<PrimaLiquidationRecord[]>;
  findById(tenantId: string, id: string): Promise<PrimaLiquidationRecord | null>;
  upsertCalculationTx(
    tx: Prisma.TransactionClient,
    data: UpsertPrimaLiquidationData,
  ): Promise<PrimaLiquidationRecord>;
  /**
   * OS-591 (fase 1, cierre de hallazgos) — `nextStatus` lo decide el caller (PrimaService),
   * que es quien conoce `accruedAmount` vs el `paidAmount` acumulado resultante: CALCULADA
   * si el pago es parcial (no alcanza lo causado), PAGADA si lo alcanza o lo supera
   * (sobrepago incluido). El repositorio no decide la transición — solo la persiste.
   */
  registerPaymentTx(
    tx: Prisma.TransactionClient,
    id: string,
    amount: Prisma.Decimal,
    nextStatus: PrimaSettlementStatus,
  ): Promise<PrimaLiquidationRecord>;
  annulTx(tx: Prisma.TransactionClient, id: string): Promise<PrimaLiquidationRecord>;
}
