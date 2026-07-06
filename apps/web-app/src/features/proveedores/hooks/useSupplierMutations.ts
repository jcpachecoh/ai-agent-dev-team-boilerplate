import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createSupplier, deleteSupplier, updateSupplier } from '../api/proveedores.mutations';
import { proveedoresKeys } from '../api/proveedores.keys';
import type { CreateSupplierInput, SupplierFormValues, UpdateSupplierInput } from '../types';
import { mapLogisticsFormToInput } from '../types';

function formToCreateInput(
  values: SupplierFormValues,
  saveLogisticsAsDraft = false,
): CreateSupplierInput {
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
    logistics: mapLogisticsFormToInput(values.logistics),
    saveLogisticsAsDraft,
  };
}

function formToUpdateInput(
  values: SupplierFormValues,
  saveLogisticsAsDraft = false,
): UpdateSupplierInput {
  return {
    ...formToCreateInput(values, saveLogisticsAsDraft),
    isActive: values.isActive,
  };
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      saveLogisticsAsDraft = false,
    }: {
      values: SupplierFormValues;
      saveLogisticsAsDraft?: boolean;
    }) => createSupplier(formToCreateInput(values, saveLogisticsAsDraft)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      values,
      saveLogisticsAsDraft = false,
    }: {
      id: string;
      values: SupplierFormValues;
      saveLogisticsAsDraft?: boolean;
    }) => updateSupplier(id, formToUpdateInput(values, saveLogisticsAsDraft)),
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
