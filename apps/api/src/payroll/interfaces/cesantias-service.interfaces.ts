import type {
  CesantiasLiquidationRecord,
  CesantiasLiquidationSummary,
  ListCesantiasLiquidationsFilters,
} from './cesantias.interfaces';
import type { CesantiasDeadlineStatus } from '../utils/cesantias-deadline.util';

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
export type CesantiasAlertSummary = {
  targetYear: number;
  deadlineDate: Date;
  pendingCount: number;
  daysUntilDeadline: number;
  status: CesantiasDeadlineStatus;
};

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

/**
 * OS-588 (fase 4, revisión previa a commit) — le dice al frontend si cada canal tiene al
 * menos una liquidación en un estado exportable (`EXPORTABLE_CESANTIAS_STATUSES`) para
 * el año dado, sin que el frontend tenga que conocer o duplicar esa lista de estados —
 * ver `CesantiasService.getExportAvailability`.
 */
export type CesantiasExportAvailability = {
  fna: boolean;
  privateOperator: boolean;
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
    pagination: Omit<ListCesantiasLiquidationsFilters, 'tenantId' | 'year'>,
  ): Promise<{ items: CesantiasLiquidationSummary[]; total: number }>;
  getDetail(tenantId: string, id: string): Promise<CesantiasLiquidationRecord>;
  getAlertSummary(tenantId: string): Promise<CesantiasAlertSummary>;
  getExportAvailability(tenantId: string, year: number): Promise<CesantiasExportAvailability>;
}
