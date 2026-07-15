import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import {
  approveFinalSettlement,
  calculateFinalSettlement,
  createManualFinalSettlement,
  markFinalSettlementPaid,
  previewFinalSettlement,
  recalculateFinalSettlement,
  reconcilePendingSalary,
  voidFinalSettlement,
} from '../api/final-settlement.client';
import { validateLegalFormula } from '../api/legal-formula-validation.client';
import type { PayrollApiError } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  CalculateFinalSettlementInput,
  CreateManualFinalSettlementInput,
  FinalSettlement,
  LegalFormulaValidation,
  MarkFinalSettlementPaidInput,
  PendingSalaryReconciliation,
  PreviewFinalSettlementInput,
  ReconcilePendingSalaryInput,
  SettlementPreviewResult,
  ValidateLegalFormulaInput,
  VoidFinalSettlementInput,
} from '../types/final-settlement.types';

function invalidateSettlement(
  queryClient: ReturnType<typeof useQueryClient>,
  settlement: FinalSettlement,
): void {
  void queryClient.invalidateQueries({
    queryKey: payrollKeys.finalSettlementsByEmployee(settlement.employeeDetailsId),
  });
  void queryClient.invalidateQueries({
    queryKey: payrollKeys.finalSettlementDetail(settlement.id),
  });
}

/** No persiste — solo previsualiza. No usa cache de react-query (siempre se re-ejecuta). */
export function usePreviewFinalSettlementMutation(): UseMutationResult<
  SettlementPreviewResult,
  PayrollApiError,
  PreviewFinalSettlementInput
> {
  return useMutation({ mutationFn: previewFinalSettlement });
}

export function useCalculateFinalSettlementMutation(): UseMutationResult<
  FinalSettlement,
  PayrollApiError,
  CalculateFinalSettlementInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CalculateFinalSettlementInput) => calculateFinalSettlement(input),
    onSuccess: (settlement) => invalidateSettlement(queryClient, settlement),
  });
}

export function useCreateManualFinalSettlementMutation(): UseMutationResult<
  FinalSettlement,
  PayrollApiError,
  CreateManualFinalSettlementInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateManualFinalSettlementInput) => createManualFinalSettlement(input),
    onSuccess: (settlement) => invalidateSettlement(queryClient, settlement),
  });
}

export function useRecalculateFinalSettlementMutation(): UseMutationResult<
  FinalSettlement,
  PayrollApiError,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recalculateFinalSettlement(id),
    onSuccess: (settlement) => invalidateSettlement(queryClient, settlement),
  });
}

/** Aprobar dispara la terminación real del contrato — invalida también el listado de
 * empleados para que `isActive` se refresque (efecto lateral del backend, no del cliente). */
export function useApproveFinalSettlementMutation(): UseMutationResult<
  FinalSettlement,
  PayrollApiError,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveFinalSettlement(id),
    onSuccess: (settlement) => {
      invalidateSettlement(queryClient, settlement);
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employees() });
    },
  });
}

export function useMarkFinalSettlementPaidMutation(): UseMutationResult<
  FinalSettlement,
  PayrollApiError,
  { id: string; input: MarkFinalSettlementPaidInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarkFinalSettlementPaidInput }) =>
      markFinalSettlementPaid(id, input),
    onSuccess: (settlement) => invalidateSettlement(queryClient, settlement),
  });
}

export function useVoidFinalSettlementMutation(): UseMutationResult<
  FinalSettlement,
  PayrollApiError,
  { id: string; input: VoidFinalSettlementInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VoidFinalSettlementInput }) =>
      voidFinalSettlement(id, input),
    onSuccess: (settlement) => invalidateSettlement(queryClient, settlement),
  });
}

export function useReconcilePendingSalaryMutation(): UseMutationResult<
  PendingSalaryReconciliation,
  PayrollApiError,
  { id: string; input: ReconcilePendingSalaryInput }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReconcilePendingSalaryInput }) =>
      reconcilePendingSalary(id, input),
    onSuccess: (_reconciliation, variables) => {
      void queryClient.invalidateQueries({
        queryKey: payrollKeys.pendingSalaryReconciliation(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: payrollKeys.finalSettlementDetail(variables.id),
      });
    },
  });
}

export function useValidateLegalFormulaMutation(): UseMutationResult<
  LegalFormulaValidation,
  PayrollApiError,
  ValidateLegalFormulaInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ValidateLegalFormulaInput) => validateLegalFormula(input),
    onSuccess: (validation) => {
      void queryClient.invalidateQueries({
        queryKey: payrollKeys.legalFormulaValidationActive(validation.formulaVersion),
      });
    },
  });
}
