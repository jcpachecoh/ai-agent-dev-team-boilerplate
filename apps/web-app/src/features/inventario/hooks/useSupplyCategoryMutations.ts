import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createSupplyCategory,
  deleteSupplyCategory,
  updateSupplyCategory,
} from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';
import type { SupplyCategoryApi, SupplyCategoryFormValues } from '../types';

function toCreateInput(values: SupplyCategoryFormValues) {
  return {
    nombre: values.nombre.trim(),
    prefijo: values.prefijo.trim().toUpperCase(),
    descripcion: values.descripcion.trim() || undefined,
  };
}

function toUpdateInput(values: SupplyCategoryFormValues, original: SupplyCategoryApi) {
  const nombre = values.nombre.trim();
  const prefijo = values.prefijo.trim().toUpperCase();
  const descripcion = values.descripcion.trim() || undefined;
  const input: {
    nombre?: string;
    prefijo?: string;
    descripcion?: string;
    isActive?: boolean;
  } = {};

  if (nombre !== original.nombre) input.nombre = nombre;
  if (prefijo !== original.prefijo) input.prefijo = prefijo;
  if (descripcion !== (original.descripcion ?? undefined)) input.descripcion = descripcion;
  if (values.isActive !== original.isActive) input.isActive = values.isActive;

  return input;
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
    mutationFn: ({
      id,
      values,
      original,
    }: {
      id: string;
      values: SupplyCategoryFormValues;
      original: SupplyCategoryApi;
    }) => updateSupplyCategory(id, toUpdateInput(values, original)),
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

export function useDeleteSupplyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSupplyCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    },
  });
}
