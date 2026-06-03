import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSupplyCategory, updateSupplyCategory } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';
import type { SupplyCategoryFormValues } from '../types';

function toCreateInput(values: SupplyCategoryFormValues) {
  return {
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || undefined,
  };
}

function toUpdateInput(values: SupplyCategoryFormValues) {
  return {
    nombre: values.nombre.trim(),
    descripcion: values.descripcion.trim() || undefined,
    isActive: values.isActive,
  };
}

export function useCreateSupplyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SupplyCategoryFormValues) => createSupplyCategory(toCreateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    },
  });
}

export function useUpdateSupplyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplyCategoryFormValues }) =>
      updateSupplyCategory(id, toUpdateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    },
  });
}

export function useDeactivateSupplyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateSupplyCategory(id, { isActive: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    },
  });
}
