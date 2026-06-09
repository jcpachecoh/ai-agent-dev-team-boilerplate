import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createProductionOrder,
  fetchProductionOrderById,
  fetchProductionOrders,
  fetchProductionRecipes,
  planProductionOrder,
  updateExecutionRoute,
  updateProductionOrder,
  updateProductionOrderDocument,
} from '../api/produccion.api';
import { produccionKeys } from '../api/produccion.keys';
import type {
  CreateProductionOrderInput,
  ListProductionOrdersFilters,
  UpdateExecutionRouteInput,
  UpdateProductionOrderDocumentInput,
  UpdateProductionOrderInput,
} from '../types';

export function useProductionOrders(filters: ListProductionOrdersFilters = {}) {
  return useQuery({
    queryKey: produccionKeys.orders(filters),
    queryFn: () => fetchProductionOrders(filters),
  });
}

export function useProductionOrder(id: string | undefined) {
  return useQuery({
    queryKey: produccionKeys.order(id ?? ''),
    queryFn: () => fetchProductionOrderById(id!),
    enabled: Boolean(id),
  });
}

export function useProductionRecipes() {
  return useQuery({
    queryKey: produccionKeys.recipes(),
    queryFn: fetchProductionRecipes,
    select: (recipes) => recipes.filter((r) => r.isActive),
  });
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductionOrderInput) => createProductionOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
    },
  });
}

export function usePlanProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => planProductionOrder(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
      void queryClient.invalidateQueries({ queryKey: produccionKeys.order(id) });
    },
  });
}

export function useUpdateProductionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductionOrderInput }) =>
      updateProductionOrder(id, input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
      void queryClient.invalidateQueries({ queryKey: produccionKeys.order(data.id) });
    },
  });
}

export function useUpdateProductionOrderDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductionOrderDocumentInput }) =>
      updateProductionOrderDocument(id, input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
      void queryClient.invalidateQueries({ queryKey: produccionKeys.order(data.id) });
    },
  });
}

export function useUpdateExecutionRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      executionId,
      orderId,
      input,
    }: {
      executionId: string;
      orderId: string;
      input: UpdateExecutionRouteInput;
    }) => updateExecutionRoute(executionId, input),
    onSuccess: (_data, { orderId }) => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
      void queryClient.invalidateQueries({ queryKey: produccionKeys.order(orderId) });
    },
  });
}
