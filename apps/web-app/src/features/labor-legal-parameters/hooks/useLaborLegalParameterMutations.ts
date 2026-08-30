import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createLaborLegalParameterGql,
  deleteLaborLegalParameterGql,
  updateLaborLegalParameterGql,
} from '../api/labor-legal-parameters.graphql';
import { laborLegalParametersKeys } from '../api/labor-legal-parameters.keys';
import type {
  CreateLaborLegalParameterFormValues,
  UpdateLaborLegalParameterFormValues,
} from '../types';

export function useCreateLaborLegalParameter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLaborLegalParameterFormValues) => createLaborLegalParameterGql(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: laborLegalParametersKeys.all });
    },
  });
}

export function useUpdateLaborLegalParameter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateLaborLegalParameterFormValues }) =>
      updateLaborLegalParameterGql(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: laborLegalParametersKeys.all });
    },
  });
}

export function useDeleteLaborLegalParameter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLaborLegalParameterGql(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: laborLegalParametersKeys.all });
    },
  });
}
