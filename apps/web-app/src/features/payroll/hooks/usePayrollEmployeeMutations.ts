import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createPayrollEmployee,
  removePayrollEmployee,
  updatePayrollEmployee,
} from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  CreatePayrollEmployeeInput,
  UpdatePayrollEmployeeInput,
} from '../types/payroll.types';

export function useCreatePayrollEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePayrollEmployeeInput) => createPayrollEmployee(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employees() });
    },
  });
}

export function useUpdatePayrollEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdatePayrollEmployeeInput }) =>
      updatePayrollEmployee(userId, input),
    onSuccess: (_employee, variables) => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employees() });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employee(variables.userId) });
    },
  });
}

export function useRemovePayrollEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removePayrollEmployee(userId),
    onSuccess: (_result, userId) => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employees() });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employee(userId) });
    },
  });
}
