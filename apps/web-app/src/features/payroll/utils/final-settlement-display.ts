import type {
  ContractTerminationReason,
  FinalSettlementMode,
  FinalSettlementStatus,
} from '../types/final-settlement.types';

export { formatCurrencyCop, formatDateOnly } from './payroll-employee-display.utils';

export const FINAL_SETTLEMENT_STATUS_LABELS: Record<FinalSettlementStatus, string> = {
  DRAFT: 'Borrador',
  CALCULATED: 'Calculada',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  VOIDED: 'Anulada',
};

export const FINAL_SETTLEMENT_MODE_LABELS: Record<FinalSettlementMode, string> = {
  AUTOMATIC: 'Automática',
  MANUAL: 'Manual',
};

export const CONTRACT_TERMINATION_REASON_LABELS: Record<ContractTerminationReason, string> = {
  RENUNCIA: 'Renuncia',
  JUSTA_CAUSA: 'Terminación con justa causa',
  SIN_JUSTA_CAUSA: 'Terminación sin justa causa',
  MUTUO_ACUERDO: 'Mutuo acuerdo',
  VENCIMIENTO_TERMINO: 'Vencimiento del término pactado',
  MUERTE_TRABAJADOR: 'Muerte del trabajador',
  OTRA: 'Otra',
};

export const CONTRACT_TERMINATION_REASON_OPTIONS: Array<{
  value: ContractTerminationReason;
  label: string;
}> = (Object.keys(CONTRACT_TERMINATION_REASON_LABELS) as ContractTerminationReason[]).map(
  (value) => ({ value, label: CONTRACT_TERMINATION_REASON_LABELS[value] }),
);

/**
 * Códigos que el backend antepone a los mensajes de bloqueo/error (formato `codigo —
 * detalle`) — ver `final-settlement-aggregator.service.ts` (bloqueos de `preview`/
 * `calculate`) y `final-settlement.service.ts#approve` (bloqueos de `approve`).
 */
export const SETTLEMENT_BLOCK_CODES = {
  // Bloqueos de preview/calculate (aggregator)
  noActiveContract: 'no_active_contract',
  noSalaryHistory: 'no_salary_history',
  variableAvgUnresolvable: 'variable_avg_unresolvable',
  netNegative: 'net_negative',
  // Bloqueos de approve
  emptySettlement: 'empty_settlement',
  legalFormulaNotValidated: 'legal_formula_not_validated',
  pendingSalaryNotReconciled: 'pending_salary_not_reconciled',
  manualInsufficientSupport: 'manual_settlement_insufficient_support',
} as const;

export function settlementMessageIncludesCode(message: string, code: string): boolean {
  return message.includes(code);
}
