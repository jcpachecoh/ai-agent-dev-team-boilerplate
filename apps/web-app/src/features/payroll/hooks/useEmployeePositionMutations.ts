import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createEmployeePosition,
  deactivateEmployeePosition,
  updateEmployeePosition,
} from '../api/employee-positions.api';
import { payrollKeys } from '../api/queryKeys';
import type {
  CreateEmployeePositionInput,
  UpdateEmployeePositionInput,
} from '../types/employee-position.types';

export function useCreateEmployeePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeePositionInput) => createEmployeePosition(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.positions() });
    },
  });
}

export function useUpdateEmployeePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeePositionInput }) =>
      updateEmployeePosition(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.positions() });
    },
  });
}

export function useDeactivateEmployeePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateEmployeePosition(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.positions() });
    },
  });
}
