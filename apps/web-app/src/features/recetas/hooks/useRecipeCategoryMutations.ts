import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createRecipeCategory,
  deleteRecipeCategory,
  updateRecipeCategory,
} from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';
import type { RecipeCategoryFormValues } from '../types';

function toCreateInput(values: RecipeCategoryFormValues) {
  return {
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || undefined,
  };
}

function toUpdateInput(values: RecipeCategoryFormValues) {
  return {
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || undefined,
    isActive: values.isActive,
  };
}

export function useCreateRecipeCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: RecipeCategoryFormValues) => createRecipeCategory(toCreateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
}

export function useUpdateRecipeCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: RecipeCategoryFormValues }) =>
      updateRecipeCategory(id, toUpdateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
}

export function useDeactivateRecipeCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateRecipeCategory(id, { isActive: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
}

export function useDeleteRecipeCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecipeCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
}
