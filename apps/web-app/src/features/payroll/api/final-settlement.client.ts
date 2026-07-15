import { payrollFetch, payrollFetchBlobWithHeaders } from './payroll.client';
import type {
  CalculateFinalSettlementInput,
  CreateManualFinalSettlementInput,
  FinalSettlement,
  MarkFinalSettlementPaidInput,
  PendingSalaryReconciliation,
  PreviewFinalSettlementInput,
  ReconcilePendingSalaryInput,
  SettlementPreviewResult,
  VoidFinalSettlementInput,
} from '../types/final-settlement.types';

/** OS-591 (fase 4) — nunca recalcula nada en el cliente: solo envía inputs y muestra lo que
 * el backend devuelve (lines, warnings, blocks, totales). */
export function previewFinalSettlement(
  input: PreviewFinalSettlementInput,
): Promise<SettlementPreviewResult> {
  return payrollFetch<SettlementPreviewResult>('/final-settlements/preview', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function calculateFinalSettlement(
  input: CalculateFinalSettlementInput,
): Promise<FinalSettlement> {
  return payrollFetch<FinalSettlement>('/final-settlements/calculate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createManualFinalSettlement(
  input: CreateManualFinalSettlementInput,
): Promise<FinalSettlement> {
  return payrollFetch<FinalSettlement>('/final-settlements/manual', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function recalculateFinalSettlement(id: string): Promise<FinalSettlement> {
  return payrollFetch<FinalSettlement>(`/final-settlements/${id}/recalculate`, {
    method: 'POST',
  });
}

export function approveFinalSettlement(id: string): Promise<FinalSettlement> {
  return payrollFetch<FinalSettlement>(`/final-settlements/${id}/approve`, {
    method: 'POST',
  });
}

export function markFinalSettlementPaid(
  id: string,
  input: MarkFinalSettlementPaidInput,
): Promise<FinalSettlement> {
  return payrollFetch<FinalSettlement>(`/final-settlements/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function voidFinalSettlement(
  id: string,
  input: VoidFinalSettlementInput,
): Promise<FinalSettlement> {
  return payrollFetch<FinalSettlement>(`/final-settlements/${id}/void`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function reconcilePendingSalary(
  id: string,
  input: ReconcilePendingSalaryInput,
): Promise<PendingSalaryReconciliation> {
  return payrollFetch<PendingSalaryReconciliation>(
    `/final-settlements/${id}/pending-salary-reconciliation`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function getPendingSalaryReconciliation(
  id: string,
): Promise<PendingSalaryReconciliation | null> {
  return payrollFetch<PendingSalaryReconciliation | null>(
    `/final-settlements/${id}/pending-salary-reconciliation`,
  );
}

export function listFinalSettlementsByEmployee(
  employeeDetailsId: string,
): Promise<FinalSettlement[]> {
  return payrollFetch<FinalSettlement[]>(`/final-settlements/employee/${employeeDetailsId}`);
}

export function getFinalSettlement(id: string): Promise<FinalSettlement> {
  return payrollFetch<FinalSettlement>(`/final-settlements/${id}`);
}

/** OS-591 (fase 5) — comprobante PDF generado por el backend exclusivamente a partir del
 * snapshot persistido (disponible para CALCULATED/APPROVED/PAID). */
export async function downloadFinalSettlementReceipt(id: string): Promise<Blob> {
  const { blob } = await payrollFetchBlobWithHeaders(`/final-settlements/${id}/receipt`);
  return blob;
}
