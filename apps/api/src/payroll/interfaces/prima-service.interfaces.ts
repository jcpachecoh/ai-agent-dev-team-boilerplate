import type { PrimaHalf } from '@prisma/client';

import type { PrimaLiquidationRecord } from './prima.interfaces';

/** Liquidación persistida considerada en el cálculo de saldo (cualquier año/semestre/estado). */
export type PrimaSourceLiquidation = {
  id: string;
  year: number;
  half: PrimaHalf;
  status: PrimaLiquidationRecord['status'];
  accruedAmount: string;
  paidAmount: string;
};

export type PrimaBalanceSegment = {
  start: Date;
  endExclusive: Date;
  /** Sueldo del tramo (sin auxilio ni promedio variable). */
  salaryAmount: string;
  commercialDays: number;
  includedInBase: boolean;
  transportSubsidyApplied: boolean;
  /** Auxilio de transporte efectivamente aplicado en el tramo — '0' si no aplica. */
  transportSubsidyAmount: string;
  /**
   * Promedio de salario variable/comisiones — siempre '0' mientras no exista una fuente
   * consolidada de pago variable en el sistema. Ver tasks/OS-591.md.
   */
  variableAverageAmount: string;
  /** Base total del tramo = salaryAmount + transportSubsidyAmount + variableAverageAmount. */
  segmentBase: string;
  segmentPrima: string;
};

/**
 * OS-591 (fase 1) — contrato de consulta `getPrimaBalanceAsOf`. `accruedAmount`/`paidAmount`
 * consolidan TODAS las liquidaciones no ANULADAS del empleado (histórico completo, no solo
 * el semestre en curso) más el tramo del semestre actual calculado EN VIVO (no persistido)
 * desde el último cierre registrado hasta `asOfDate` — ver PrimaService.getPrimaBalanceAsOf.
 */
export type PrimaBalanceAsOf = {
  asOfDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  baseAmount: string;
  accruedAmount: string;
  paidAmount: string;
  overpaymentAmount: string;
  pendingAmount: string;
  segments: PrimaBalanceSegment[];
  sourceLiquidations: PrimaSourceLiquidation[];
  divisorSnapshot: string;
};

export interface IPrimaService {
  getPrimaBalanceAsOf(
    tenantId: string,
    employeeId: string,
    asOfDate: Date,
  ): Promise<PrimaBalanceAsOf>;
  calculateForEmployeeSemester(
    tenantId: string,
    employeeId: string,
    year: number,
    half: PrimaHalf,
    userId?: string,
  ): Promise<PrimaLiquidationRecord>;
  registerPayment(
    tenantId: string,
    id: string,
    amount: number | string,
  ): Promise<PrimaLiquidationRecord>;
  annul(tenantId: string, id: string): Promise<PrimaLiquidationRecord>;
}
