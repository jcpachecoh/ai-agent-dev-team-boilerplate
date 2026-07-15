import type {
  ContractTerminationReason,
  EmployeeContractType,
  FinalSettlementMode,
  FinalSettlementStatus,
  Prisma,
  SalaryType,
  SettlementLineOrigin,
  SettlementLineType,
} from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Repository types
// ─────────────────────────────────────────────────────────────────────────────

export type SettlementLineRecord = {
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
  createdAt: Date;
};

export type FinalSettlementRecord = {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  contractId: string;
  effectiveTerminationDate: Date;
  terminationReason: ContractTerminationReason;
  status: FinalSettlementStatus;
  mode: FinalSettlementMode;
  snapshotContractType: EmployeeContractType;
  snapshotContractStartDate: Date;
  snapshotAgreedEndDate: Date | null;
  snapshotSalaryType: SalaryType;
  snapshotSalaryAmount: string;
  snapshotSmlvAmount: string;
  snapshotTransportSubsidyAmount: string;
  snapshotFormulaVersion: number;
  snapshotSmlvThreshold: string;
  snapshotVariableAvgMonthsCovered: number;
  snapshotVariableAvgTotal: string;
  snapshotVariableAvgMonthly: string;
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
  calculatedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  paidBy: string | null;
  paidAt: Date | null;
  paymentReference: string | null;
  paymentDate: Date | null;
  voidedBy: string | null;
  voidedAt: Date | null;
  voidReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: SettlementLineRecord[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Audit
// ─────────────────────────────────────────────────────────────────────────────

export type SettlementAuditEvent = {
  event:
    | 'DRAFT_CREATED'
    | 'CALCULATED'
    | 'RECALCULATED'
    | 'MANUAL_CREATED'
    | 'VOIDED'
    | 'APPROVED'
    | 'PAID'
    // OS-591 (fase 3) — registrado cuando se crea una PendingSalaryReconciliation para
    // esta liquidación (ver interfaces/pending-salary-reconciliation.interfaces.ts).
    | 'PENDING_SALARY_RECONCILED';
  actor: string | null;
  timestamp: string; // ISO-8601
  detail?: string;
  /** Totales al momento del evento (presentes en CALCULATED/RECALCULATED/MANUAL_CREATED). */
  totals?: {
    grossDevengados: string;
    totalDeducciones: string;
    netAmount: string;
    netNegativeAmount?: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Indemnification engine
// ─────────────────────────────────────────────────────────────────────────────

export type IndemnificationInputs = {
  contractType: EmployeeContractType;
  terminationReason: ContractTerminationReason;
  /** Fecha de inicio del contrato (para calcular antigüedad). */
  contractStartDate: Date;
  effectiveTerminationDate: Date;
  /** Salario vigente a la fecha de terminación. */
  monthlySalary: Prisma.Decimal;
  /** SMLMV vigente (para comparación de umbral). */
  smlvAmount: Prisma.Decimal;
  /** Umbral en múltiplos de SMLMV (ej: 10). */
  smlvThreshold: Prisma.Decimal;
  /** Fecha pactada de vencimiento (FIJO/OBRA). */
  agreedEndDate?: Date | null;
  /** Días restantes estimados para OBRA_LABOR. */
  estimatedRemainingDays?: number | null;
  /** Justificación para `estimatedRemainingDays` (obligatoria en OBRA_LABOR). */
  estimatedRemainingDaysJustification?: string | null;
  /** Versión de fórmula usada. */
  formulaVersion: number;
};

export type IndemnificationResult = {
  monthlySalary: string;
  dailySalary: string;
  indemnifiedDays: number;
  amount: string;
  appliedRule: string;
  formulaVersion: number;
  inputs: {
    contractType: EmployeeContractType;
    terminationReason: ContractTerminationReason;
    tenureYears: number;
    tenureDays: number;
    monthlySalaryVsSmlv: string;
    thresholdSmlv: string;
    agreedEndDate?: string;
    estimatedRemainingDays?: number;
  };
  warnings: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Variable average
// ─────────────────────────────────────────────────────────────────────────────

export type VariableAverageResult = {
  /** ISO-8601 fecha de inicio del período considerado. */
  periodStart: string;
  /** ISO-8601 fecha de fin del período considerado (= effectiveTerminationDate). */
  periodEnd: string;
  /** Número de meses completos cubiertos (máximo 6). */
  monthsCovered: number;
  /** Días calendario cubiertos. */
  daysCovered: number;
  /** Total bruto de pagos variables en el período. */
  totalVariable: string;
  /** Promedio mensual = totalVariable / monthsCovered (0 si monthsCovered = 0). */
  monthlyAverage: string;
  /** Conceptos detectados con pago variable (vacío si no hay). */
  includedConcepts: string[];
  /** Fuentes de nómina utilizadas (identificadores de registros). */
  payrollSources: string[];
  /**
   * true si se detectaron pagos variables pero el promedio no pudo resolverse
   * correctamente (p.ej. menos de 1 mes, datos incompletos). En este caso el
   * aggregator BLOQUEA la aprobación automática hasta que un actor humano lo
   * confirme explícitamente.
   */
  unresolvable: boolean;
  warnings: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Pending salary
// ─────────────────────────────────────────────────────────────────────────────

export type PendingSalaryResult = {
  periodStart: Date;
  periodEnd: Date;
  /** Días calendario del tramo no pagado. */
  calendarDays: number;
  /** Días comerciales (convención 30/mes). */
  commercialDays: number;
  monthlySalary: string;
  dailySalary: string;
  basePendingSalary: string;
  novedadDeductions: string;
  pendingOvertimeAmount: string;
  totalPendingSalary: string;
  breakdown: {
    concept: string;
    amount: string;
    detail?: string;
  }[];
  sources: string[];
  warnings: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Aggregator
// ─────────────────────────────────────────────────────────────────────────────

export type SettlementLineInput = {
  code: string;
  name: string;
  type: SettlementLineType;
  origin: SettlementLineOrigin;
  sourceReference?: string | null;
  baseAmount?: Prisma.Decimal | null;
  quantity?: Prisma.Decimal | null;
  rate?: Prisma.Decimal | null;
  amount: Prisma.Decimal;
  metadata?: Record<string, unknown>;
  manualJustification?: string | null;
  sortOrder?: number;
};

export type SettlementAggregateResult = {
  lines: SettlementLineInput[];
  grossDevengados: string;
  totalDeducciones: string;
  /** netAmount = max(0, grossDevengados - totalDeducciones). */
  netAmount: string;
  /**
   * Déficit cuando totalDeducciones > grossDevengados. '0.00' si no hay déficit.
   * Cuando > '0.00', el aggregator emite un bloqueo "net_negative" y netAmount = '0.00'.
   * El actor humano debe resolver el saldo antes de aprobar (Fase 3).
   */
  netNegativeAmount: string;
  warnings: string[];
  /**
   * Bloqueos que impiden persistir (o aprobar) la liquidación. El preview puede
   * devolver bloqueos — la persistencia los rechaza con ConflictException.
   */
  blocks: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Create/update inputs
// ─────────────────────────────────────────────────────────────────────────────

export type CreateFinalSettlementData = {
  tenantId: string;
  employeeDetailsId: string;
  contractId: string;
  effectiveTerminationDate: Date;
  terminationReason: ContractTerminationReason;
  mode: FinalSettlementMode;
  snapshotContractType: EmployeeContractType;
  snapshotContractStartDate: Date;
  snapshotAgreedEndDate?: Date | null;
  snapshotSalaryType: SalaryType;
  snapshotSalaryAmount: Prisma.Decimal;
  snapshotSmlvAmount: Prisma.Decimal;
  snapshotTransportSubsidyAmount: Prisma.Decimal;
  snapshotFormulaVersion: number;
  snapshotSmlvThreshold: Prisma.Decimal;
  snapshotVariableAvgMonthsCovered: number;
  snapshotVariableAvgTotal: Prisma.Decimal;
  snapshotVariableAvgMonthly: Prisma.Decimal;
  grossDevengados: Prisma.Decimal;
  totalDeducciones: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  snapshotNetNegativeAmount: Prisma.Decimal;
  lines: SettlementLineInput[];
  acceptedWarnings?: string[];
  /** Required when mode=MANUAL. */
  manualJustification?: string | null;
  manualReference?: string | null;
  manualResponsible?: string | null;
  createdBy?: string | null;
};

export type RecalculateFinalSettlementData = {
  tenantId: string;
  id: string;
  grossDevengados: Prisma.Decimal;
  totalDeducciones: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  snapshotNetNegativeAmount: Prisma.Decimal;
  snapshotVariableAvgMonthsCovered: number;
  snapshotVariableAvgTotal: Prisma.Decimal;
  snapshotVariableAvgMonthly: Prisma.Decimal;
  lines: SettlementLineInput[];
  acceptedWarnings?: string[];
  calculatedBy?: string | null;
};

export type VoidFinalSettlementData = {
  tenantId: string;
  id: string;
  voidReason: string;
  voidedBy?: string | null;
};

export type ApproveFinalSettlementData = {
  tenantId: string;
  id: string;
  approvedBy: string;
};

/**
 * Efecto colateral ejecutado DENTRO de la misma transacción que aprueba la liquidación
 * (ver tasks/OS-591.md §15.3/§15.4) — usado por `FinalSettlementService.approve()` para
 * terminar el contrato activo (`EmployeeContractRepository.terminateActiveContractTx`) sin
 * que `FinalSettlementRepository` dependa directamente de otro repositorio (mantiene la
 * capa de repositorio acotada a `FinalSettlement`/`SettlementLine`). Si el efecto lanza,
 * la transacción completa hace rollback — la liquidación permanece CALCULATED.
 */
export type ApproveSideEffect = (tx: Prisma.TransactionClient) => Promise<void>;

export type MarkPaidFinalSettlementData = {
  tenantId: string;
  id: string;
  paidBy: string;
  /** Referencia externa del pago (p.ej. número de comprobante/transferencia). Obligatoria. */
  paymentReference: string;
  /** Fecha REAL en que se ejecutó el pago — puede diferir de `paidAt` (registro en sistema). */
  paymentDate: Date;
};

/** Input de servicio para `markPaid` — ver `MarkPaidFinalSettlementData` para el detalle. */
export type MarkPaidInput = {
  paidBy: string;
  paymentReference: string;
  paymentDate: Date;
};

// ─────────────────────────────────────────────────────────────────────────────
// Repository interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IFinalSettlementRepository {
  findById(tenantId: string, id: string): Promise<FinalSettlementRecord | null>;
  findActiveByContract(tenantId: string, contractId: string): Promise<FinalSettlementRecord | null>;
  findAllByEmployee(tenantId: string, employeeDetailsId: string): Promise<FinalSettlementRecord[]>;
  create(data: CreateFinalSettlementData): Promise<FinalSettlementRecord>;
  recalculate(data: RecalculateFinalSettlementData): Promise<FinalSettlementRecord>;
  void(data: VoidFinalSettlementData): Promise<FinalSettlementRecord>;
  /**
   * CALCULATED → APPROVED, dentro de una única transacción de base de datos (ver
   * tasks/OS-591.md §15.3/§15.4 — atomicidad). Re-lee el estado DENTRO de la transacción
   * para bloquear carreras (misma técnica que `recalculate`), ejecuta `sideEffect` (p.ej.
   * terminar el contrato activo + `EmployeeDetails.isActive=false`) en la MISMA
   * transacción, y solo entonces transiciona el estado — si `sideEffect` lanza, o si el
   * estado ya no es CALCULATED, todo hace rollback (la liquidación permanece intacta).
   */
  approve(
    data: ApproveFinalSettlementData,
    sideEffect?: ApproveSideEffect,
  ): Promise<FinalSettlementRecord>;
  /** APPROVED → PAID. Mismo patrón de update condicional que `approve`. */
  markPaid(data: MarkPaidFinalSettlementData): Promise<FinalSettlementRecord>;
  /**
   * Agrega un evento al `auditTrail` sin tocar `status` ni ningún otro campo — usado por
   * procesos cruzados como `PendingSalaryReconciliationService` que necesitan dejar
   * constancia en la liquidación sin duplicar la lógica de transición de estado.
   */
  appendAuditEvent(tenantId: string, id: string, event: SettlementAuditEvent): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service interface
// ─────────────────────────────────────────────────────────────────────────────

export type PreviewSettlementInput = {
  tenantId: string;
  employeeDetailsId: string;
  effectiveTerminationDate: Date;
  terminationReason: ContractTerminationReason;
  /** Días restantes estimados para OBRA_LABOR (obligatorio si aplica). */
  estimatedRemainingDays?: number | null;
  estimatedRemainingDaysJustification?: string | null;
};

export type CalculateAndSaveInput = PreviewSettlementInput & {
  mode?: FinalSettlementMode;
  acceptedWarnings?: string[];
  createdBy?: string | null;
  /** Required when mode=MANUAL. */
  manualJustification?: string | null;
  manualReference?: string | null;
  manualResponsible?: string | null;
};

/**
 * `contractId` NO se recibe del cliente — se resuelve server-side vía
 * `EmployeeContractRepository.findActiveContract(tenantId, employeeDetailsId)`, igual que
 * `calculateAndSave` (ver tasks/OS-591.md §15.10). Ningún endpoint de lectura expone el
 * contractId del contrato activo, así que exigirlo en el body dejaba `createManual`
 * inalcanzable para un cliente legítimo.
 */
export type ManualSettlementInput = {
  tenantId: string;
  employeeDetailsId: string;
  effectiveTerminationDate: Date;
  terminationReason: ContractTerminationReason;
  lines: Array<{
    code: string;
    name: string;
    type: SettlementLineType;
    amount: Prisma.Decimal;
    manualJustification: string;
    metadata?: Record<string, unknown>;
    sortOrder?: number;
  }>;
  manualJustification: string;
  manualReference: string;
  manualResponsible: string;
  createdBy?: string | null;
};

export interface IFinalSettlementService {
  preview(input: PreviewSettlementInput): Promise<SettlementAggregateResult>;
  calculateAndSave(input: CalculateAndSaveInput): Promise<FinalSettlementRecord>;
  recalculate(tenantId: string, id: string, calculatedBy?: string): Promise<FinalSettlementRecord>;
  void(
    tenantId: string,
    id: string,
    voidReason: string,
    actor?: string,
  ): Promise<FinalSettlementRecord>;
  createManual(input: ManualSettlementInput): Promise<FinalSettlementRecord>;
  /**
   * CALCULATED → APPROVED (ver tasks/OS-591.md §15.3). Valida, en orden: liquidación sin
   * líneas, indemnización automática sin validación legal activa, salario pendiente sin
   * reconciliación, y (MANUAL) soporte insuficiente — MANUAL nunca evade estos gates. Si
   * pasa: termina el contrato activo del empleado (§15.4) y audita.
   */
  approve(tenantId: string, id: string, approvedBy: string): Promise<FinalSettlementRecord>;
  /**
   * APPROVED → PAID. Requiere `paymentReference` (comprobante/transferencia) y
   * `paymentDate` (fecha real del pago, no confundir con `paidAt` = cuándo se registró) —
   * ver tasks/OS-591.md §15.3. Reintentar sobre una liquidación ya PAID es un conflicto
   * explícito (409), no un no-op idempotente — no hay clave de idempotencia que permita
   * distinguir un reintento legítimo de un segundo pago real.
   */
  markPaid(tenantId: string, id: string, data: MarkPaidInput): Promise<FinalSettlementRecord>;
  findById(tenantId: string, id: string): Promise<FinalSettlementRecord>;
  findAllByEmployee(tenantId: string, employeeDetailsId: string): Promise<FinalSettlementRecord[]>;
}
