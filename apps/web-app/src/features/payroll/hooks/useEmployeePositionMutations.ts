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

export function useEmployeePositionMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: payrollKeys.positions() });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateEmployeePositionInput) => createEmployeePosition(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeePositionInput }) =>
      updateEmployeePosition(id, input),
    onSuccess: invalidate,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateEmployeePosition(id),
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deactivateMutation,
  };
}
