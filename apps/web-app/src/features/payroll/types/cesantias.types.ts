export type CesantiasSettlementStatus = 'CALCULADA' | 'CONSIGNADA' | 'ANULADA';

export type CesantiasInterestStatus = 'CALCULADO' | 'PAGADO' | 'ANULADO';

export type CesantiasFundChannel = 'FNA' | 'PRIVATE_OPERATOR';

export interface CesantiasLiquidation {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  year: number;
  periodStart: string;
  periodEnd: string;
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
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCesantiasFilters {
  year?: number;
  cesantiasStatus?: CesantiasSettlementStatus;
  interestStatus?: CesantiasInterestStatus;
  fundChannelSnapshot?: CesantiasFundChannel;
  fundNameSnapshot?: string;
  limit?: number;
  offset?: number;
}

export interface CesantiasListResponse {
  items: CesantiasLiquidation[];
  total: number;
  limit: number;
  offset: number;
}

export type CesantiasSkipReason =
  | 'SIN_TRASLAPE_EN_EL_ANIO'
  | 'SIN_HISTORIAL_SALARIAL'
  | 'SIN_FONDO_CESANTIAS_VIGENTE'
  | 'TIPO_CONTRATO_EXCLUIDO'
  | 'BASE_INVALIDA'
  | 'LIQUIDACION_CERRADA';

export interface CesantiasSkippedEmployee {
  employeeId: string;
  reason: CesantiasSkipReason;
  detail?: string;
}

export interface CesantiasCalculateResult {
  tenantId: string;
  year: number;
  totalEmployeesEvaluated: number;
  created: number;
  updated: number;
  skipped: CesantiasSkippedEmployee[];
  liquidations: CesantiasLiquidation[];
}

export type CesantiasDeadlineStatus =
  | 'PENDIENTE'
  | 'PROXIMA_A_VENCER'
  | 'VENCE_HOY'
  | 'VENCIDA'
  | 'COMPLETADA';

export interface CesantiasAlertSummary {
  targetYear: number;
  deadlineDate: string;
  pendingCount: number;
  daysUntilDeadline: number;
  status: CesantiasDeadlineStatus;
}

export type CesantiasExportChannel = 'fna' | 'private-funds';

export interface CesantiasExportResult {
  blob: Blob;
  filename: string | null;
  skippedCount: number;
}

/**
 * OS-588 (fase 4, revisión previa a commit) — refleja exactamente la regla que usa el
 * backend para decidir qué se incluye en cada archivo de exportación
 * (`EXPORTABLE_CESANTIAS_STATUSES` — CALCULADA/CONSIGNADA, nunca ANULADA). El frontend no
 * duplica esa lista de estados — solo consume estos dos booleanos ya calculados por
 * `GET /cesantias/export-availability`.
 */
export interface CesantiasExportAvailability {
  fna: boolean;
  privateOperator: boolean;
}
