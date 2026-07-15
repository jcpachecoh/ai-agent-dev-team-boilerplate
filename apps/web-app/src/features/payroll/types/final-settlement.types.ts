// OS-591 (fase 4) — tipos del frontend que reflejan 1:1 las interfaces del backend
// (apps/api/src/payroll/interfaces/final-settlement.interfaces.ts). Decimal/Date del backend
// viajan como string/ISO-string por JSON — nunca se recalculan en el cliente.

export type FinalSettlementStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'VOIDED';
export type FinalSettlementMode = 'AUTOMATIC' | 'MANUAL';
export type SettlementLineType = 'DEVENGO' | 'DEDUCCION';
export type SettlementLineOrigin = 'AUTOMATIC' | 'MANUAL';

export type ContractTerminationReason =
  | 'RENUNCIA'
  | 'JUSTA_CAUSA'
  | 'SIN_JUSTA_CAUSA'
  | 'MUTUO_ACUERDO'
  | 'VENCIMIENTO_TERMINO'
  | 'MUERTE_TRABAJADOR'
  | 'OTRA';

export interface SettlementLine {
  id: string;
  tenantId: string;
  settlementId: string;
  code: string;
  name: string;
  type: SettlementLineType;
  origin: SettlementLineOrigin;
  sourceReference: string | null;
  baseAmount: string | null;
  quantity: string | null;
  rate: string | null;
  amount: string;
  metadata: Record<string, unknown>;
  manualJustification: string | null;
  sortOrder: number;
  createdAt: string;
}

/** Línea del preview (aún no persistida) — mismo shape que `SettlementLine` sin id/timestamps. */
export interface SettlementPreviewLine {
  code: string;
  name: string;
  type: SettlementLineType;
  origin: SettlementLineOrigin;
  sourceReference?: string | null;
  baseAmount?: string | null;
  quantity?: string | null;
  rate?: string | null;
  amount: string;
  metadata?: Record<string, unknown>;
  manualJustification?: string | null;
  sortOrder?: number;
}

export type SettlementAuditEventType =
  | 'DRAFT_CREATED'
  | 'CALCULATED'
  | 'RECALCULATED'
  | 'MANUAL_CREATED'
  | 'VOIDED'
  | 'APPROVED'
  | 'PAID'
  | 'PENDING_SALARY_RECONCILED';

export interface SettlementAuditEvent {
  event: SettlementAuditEventType;
  actor: string | null;
  timestamp: string;
  detail?: string;
  totals?: {
    grossDevengados: string;
    totalDeducciones: string;
    netAmount: string;
    netNegativeAmount?: string;
  };
}

export interface FinalSettlement {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  contractId: string;
  effectiveTerminationDate: string;
  terminationReason: ContractTerminationReason;
  status: FinalSettlementStatus;
  mode: FinalSettlementMode;
  snapshotFormulaVersion: number;
  grossDevengados: string;
  totalDeducciones: string;
  netAmount: string;
  /** Déficit cuando grossDevengados < totalDeducciones. '0.00' si no hay déficit. */
  snapshotNetNegativeAmount: string;
  manualJustification: string | null;
  manualReference: string | null;
  manualResponsible: string | null;
  acceptedWarnings: string[];
  auditTrail: SettlementAuditEvent[];
  createdBy: string | null;
  calculatedBy: string | null;
  calculatedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  paidBy: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  paymentDate: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
  lines: SettlementLine[];
}

export interface SettlementPreviewResult {
  lines: SettlementPreviewLine[];
  grossDevengados: string;
  totalDeducciones: string;
  netAmount: string;
  netNegativeAmount: string;
  warnings: string[];
  /** Bloqueos que impiden persistir la liquidación (`calculate`). */
  blocks: string[];
}

export interface PreviewFinalSettlementInput {
  employeeDetailsId: string;
  effectiveTerminationDate: string;
  terminationReason: ContractTerminationReason;
  /** Solo aplica a contratos OBRA_LABOR. */
  estimatedRemainingDays?: number;
  estimatedRemainingDaysJustification?: string;
}

export interface CalculateFinalSettlementInput extends PreviewFinalSettlementInput {
  mode?: FinalSettlementMode;
  acceptedWarnings?: string[];
  manualJustification?: string;
  manualReference?: string;
  manualResponsible?: string;
}

export interface ManualSettlementLineInput {
  code: string;
  name: string;
  type: SettlementLineType;
  amount: string;
  manualJustification: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
}

export interface CreateManualFinalSettlementInput {
  employeeDetailsId: string;
  effectiveTerminationDate: string;
  terminationReason: ContractTerminationReason;
  lines: ManualSettlementLineInput[];
  manualJustification: string;
  manualReference: string;
  manualResponsible: string;
}

export interface MarkFinalSettlementPaidInput {
  paymentReference: string;
  paymentDate: string;
}

export interface VoidFinalSettlementInput {
  voidReason: string;
}

export interface PendingSalaryReconciliation {
  id: string;
  tenantId: string;
  settlementId: string;
  previouslyPaidAmount: string;
  paymentReference: string | null;
  paymentDate: string | null;
  responsible: string;
  observation: string;
  recognizedBalance: string;
  createdBy: string | null;
  createdAt: string;
}

export interface ReconcilePendingSalaryInput {
  previouslyPaidAmount: string;
  paymentReference?: string;
  paymentDate?: string;
  responsible: string;
  observation: string;
  recognizedBalance: string;
}

export interface LegalFormulaValidation {
  id: string;
  tenantId: string;
  formulaVersion: number;
  isActive: boolean;
  legalReference: string;
  observations: string | null;
  validatedBy: string;
  validatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateLegalFormulaInput {
  formulaVersion: number;
  legalReference: string;
  observations?: string;
}
