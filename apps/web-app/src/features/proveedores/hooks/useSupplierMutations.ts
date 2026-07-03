import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSupplier, deleteSupplier, updateSupplier } from '../api/proveedores.mutations';
import { proveedoresKeys } from '../api/proveedores.keys';
import type { CreateSupplierInput, SupplierFormValues, UpdateSupplierInput } from '../types';

function formToCreateInput(values: SupplierFormValues): CreateSupplierInput {
  return {
    razonSocial: values.razonSocial.trim(),
    nit: values.nit.trim(),
    dv: values.dv?.trim() || undefined,
    tipo: values.tipo,
    direccion: values.direccion?.trim() || undefined,
    departamento: values.departamento?.trim() || undefined,
    ciudad: values.ciudad?.trim() || undefined,
    telefono: values.telefono?.trim() || undefined,
    email: values.email?.trim() || undefined,
    contactoNombre: values.contactoNombre?.trim() || undefined,
    condicionPago: values.condicionPago,
    cupoCredito: values.cupoCredito,
  };
}

function formToUpdateInput(values: SupplierFormValues): UpdateSupplierInput {
  return {
    ...formToCreateInput(values),
    isActive: values.isActive,
  };
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SupplierFormValues) => createSupplier(formToCreateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) =>
      updateSupplier(id, formToUpdateInput(values)),
    onSuccess: (supplier) => {
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.detail(supplier.id) });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() });
    },
  });
}
