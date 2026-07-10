import type { CesantiasLiquidationRecord } from './cesantias.interfaces';

export type CesantiasSkipReason =
  | 'SIN_TRASLAPE_EN_EL_ANIO'
  | 'SIN_HISTORIAL_SALARIAL'
  | 'SIN_FONDO_CESANTIAS_VIGENTE'
  | 'TIPO_CONTRATO_EXCLUIDO'
  | 'BASE_INVALIDA'
  | 'LIQUIDACION_CERRADA';

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
export type CesantiasSkippedEmployee = {
  employeeId: string;
  reason: CesantiasSkipReason;
  detail?: string;
};

export type CesantiasCalculateForYearResult = {
  tenantId: string;
  year: number;
  totalEmployeesEvaluated: number;
  created: number;
  updated: number;
  skipped: CesantiasSkippedEmployee[];
  liquidations: CesantiasLiquidationRecord[];
};

export interface ICesantiasService {
  calculateForYear(
    tenantId: string,
    year: number,
    userId?: string,
  ): Promise<CesantiasCalculateForYearResult>;
  listByYear(
    tenantId: string,
    year: number | undefined,
    pagination: { limit?: number; offset?: number },
  ): Promise<{ items: CesantiasLiquidationRecord[]; total: number }>;
  getDetail(tenantId: string, id: string): Promise<CesantiasLiquidationRecord>;
}
