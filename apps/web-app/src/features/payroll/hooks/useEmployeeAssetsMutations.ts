import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createEmployeeAsset, updateEmployeeAsset } from '../api/employee-assets.graphql';
import { payrollKeys } from '../api/queryKeys';
import type {
  CreateEmployeeAssetInput,
  UpdateEmployeeAssetInput,
} from '../types/employee-asset.types';

export function useEmployeeAssetsMutations(employeeId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: payrollKeys.assets(employeeId) });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateEmployeeAssetInput) => createEmployeeAsset(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeAssetInput }) =>
      updateEmployeeAsset(id, input),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation };
}
