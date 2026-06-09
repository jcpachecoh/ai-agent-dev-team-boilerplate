import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createSupplierProduct,
  deleteSupplierProduct,
  updateSupplierProduct,
} from '../api/proveedores.mutations';
import { proveedoresKeys } from '../api/proveedores.keys';
import type { CreateSupplierProductInput, UpdateSupplierProductInput } from '../types';

export function useCreateSupplierProduct(supplierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateSupplierProductInput, 'supplierId'>) =>
      createSupplierProduct({ ...input, supplierId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.products(supplierId) });
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() });
    },
  });
}

export function useUpdateSupplierProduct(supplierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierProductInput }) =>
      updateSupplierProduct(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.products(supplierId) });
    },
  });
}

export function useDeleteSupplierProduct(supplierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSupplierProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.products(supplierId) });
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() });
    },
  });
}
