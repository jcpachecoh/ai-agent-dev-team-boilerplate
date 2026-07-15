// OS-591 (fase 3) — Constancia auditable de que un actor humano revisó pagos previos
// antes de aprobar una liquidación con tramo de salario pendiente. Ver tasks/OS-591.md §15.2.
// Nunca borra ni edita la advertencia `pending_salary_double_payment_risk` — es evidencia
// adicional, no un parche sobre el warning original.

export type PendingSalaryReconciliationRecord = {
  id: string;
  tenantId: string;
  settlementId: string;
  previouslyPaidAmount: string;
  paymentReference: string | null;
  paymentDate: Date | null;
  responsible: string;
  observation: string;
  recognizedBalance: string;
  createdBy: string | null;
  createdAt: Date;
};

export type CreatePendingSalaryReconciliationData = {
  tenantId: string;
  settlementId: string;
  previouslyPaidAmount: string;
  paymentReference?: string | null;
  paymentDate?: Date | null;
  responsible: string;
  observation: string;
  recognizedBalance: string;
  createdBy?: string | null;
};

export interface IPendingSalaryReconciliationRepository {
  findBySettlement(
    tenantId: string,
    settlementId: string,
  ): Promise<PendingSalaryReconciliationRecord | null>;
  create(data: CreatePendingSalaryReconciliationData): Promise<PendingSalaryReconciliationRecord>;
}

export interface IPendingSalaryReconciliationService {
  findBySettlement(
    tenantId: string,
    settlementId: string,
  ): Promise<PendingSalaryReconciliationRecord | null>;
  /**
   * Valida que la liquidación exista, pertenezca al tenant, tenga una línea SAL_PENDIENTE,
   * esté en estado CALCULATED (antes de aprobar), y no tenga ya una reconciliación —
   * luego persiste y agrega el evento `PENDING_SALARY_RECONCILED` al auditTrail.
   */
  reconcile(
    data: CreatePendingSalaryReconciliationData,
  ): Promise<PendingSalaryReconciliationRecord>;
}
