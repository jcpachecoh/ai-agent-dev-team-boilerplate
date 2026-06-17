import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { createSupplyItem, deactivateSupplyItem, updateSupplyItem } from '../api/inventario.api';
import { inventarioKeys } from '../api/inventario.keys';
import { formValuesToCreateInput, formValuesToUpdateInput } from '../mappers/formValues';
import type { InventoryProductFormValues } from '@/types/inventory';

export function useCreateSupplyItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InventoryProductFormValues) =>
      createSupplyItem(formValuesToCreateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    },
    meta: { requiresGraphql: isGraphqlConfigured() },
  });
}

export function useUpdateSupplyItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: InventoryProductFormValues }) =>
      updateSupplyItem(id, formValuesToUpdateInput(values)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.item(variables.id) });
    },
  });
}

export function useToggleSupplyItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateSupplyItem(id, { isActive }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.item(variables.id) });
    },
  });
}

export function useDeactivateSupplyItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateSupplyItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    },
  });
}
