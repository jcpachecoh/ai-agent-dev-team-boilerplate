import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createEmployeeBankAccount,
  deleteEmployeeBankAccount,
  setPrimaryEmployeeBankAccount,
  updateEmployeeBankAccount,
} from '../api/financial-profile.client';
import { payrollKeys } from '../api/queryKeys';
import type { CreateBankAccountInput, UpdateBankAccountInput } from '../types/bank-account.types';

export function useEmployeeBankAccountMutations(employeeId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: payrollKeys.bankAccounts(employeeId) });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateBankAccountInput) => createEmployeeBankAccount(employeeId, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ accountId, input }: { accountId: string; input: UpdateBankAccountInput }) =>
      updateEmployeeBankAccount(employeeId, accountId, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) => deleteEmployeeBankAccount(employeeId, accountId),
    onSuccess: invalidate,
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (accountId: string) => setPrimaryEmployeeBankAccount(employeeId, accountId),
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    setPrimaryMutation,
  };
}
