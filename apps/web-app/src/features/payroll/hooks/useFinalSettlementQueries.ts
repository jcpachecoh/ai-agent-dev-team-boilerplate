import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  getFinalSettlement,
  getPendingSalaryReconciliation,
  listFinalSettlementsByEmployee,
} from '../api/final-settlement.client';
import { getActiveLegalFormulaValidation } from '../api/legal-formula-validation.client';
import type { PayrollApiError } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  FinalSettlement,
  LegalFormulaValidation,
  PendingSalaryReconciliation,
} from '../types/final-settlement.types';

export function useFinalSettlementsByEmployeeQuery(
  employeeDetailsId: string | undefined,
): UseQueryResult<FinalSettlement[], PayrollApiError> {
  return useQuery({
    queryKey: payrollKeys.finalSettlementsByEmployee(employeeDetailsId ?? ''),
    queryFn: () => listFinalSettlementsByEmployee(employeeDetailsId!),
    enabled: Boolean(employeeDetailsId),
  });
}

export function useFinalSettlementQuery(
  id: string | undefined,
): UseQueryResult<FinalSettlement, PayrollApiError> {
  return useQuery({
    queryKey: payrollKeys.finalSettlementDetail(id ?? ''),
    queryFn: () => getFinalSettlement(id!),
    enabled: Boolean(id),
  });
}

export function usePendingSalaryReconciliationQuery(
  settlementId: string | undefined,
): UseQueryResult<PendingSalaryReconciliation | null, PayrollApiError> {
  return useQuery({
    queryKey: payrollKeys.pendingSalaryReconciliation(settlementId ?? ''),
    queryFn: () => getPendingSalaryReconciliation(settlementId!),
    enabled: Boolean(settlementId),
  });
}

export function useActiveLegalFormulaValidationQuery(
  formulaVersion: number | undefined,
): UseQueryResult<LegalFormulaValidation | null, PayrollApiError> {
  return useQuery({
    queryKey: payrollKeys.legalFormulaValidationActive(formulaVersion ?? 0),
    queryFn: () => getActiveLegalFormulaValidation(formulaVersion!),
    enabled: typeof formulaVersion === 'number',
  });
}
