import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  closeProductionCommittee,
  createProductionCommittee,
  fetchOperationsAdminUsers,
  fetchProductionCommitteeById,
  fetchProductionCommittees,
  updateProductionCommittee,
} from '../api/produccion.api';
import { produccionKeys } from '../api/produccion.keys';
import type {
  CreateProductionCommitteeInput,
  ListProductionCommitteesFilters,
  UpdateProductionCommitteeInput,
} from '../types';

export function useProductionCommittees(filters: ListProductionCommitteesFilters = {}) {
  return useQuery({
    queryKey: produccionKeys.committees(filters),
    queryFn: () => fetchProductionCommittees(filters),
  });
}

export function useProductionCommittee(id: string | undefined) {
  return useQuery({
    queryKey: produccionKeys.committee(id ?? ''),
    queryFn: () => fetchProductionCommitteeById(id!),
    enabled: Boolean(id),
  });
}

export function useOperationsAdminUsers() {
  return useQuery({
    queryKey: produccionKeys.operationsAdminUsers(),
    queryFn: fetchOperationsAdminUsers,
  });
}

export function useCreateProductionCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductionCommitteeInput) => createProductionCommittee(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
    },
  });
}

export function useUpdateProductionCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductionCommitteeInput }) =>
      updateProductionCommittee(id, input),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
      void queryClient.invalidateQueries({ queryKey: produccionKeys.committee(data.id) });
    },
  });
}

export function useCloseProductionCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => closeProductionCommittee(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: produccionKeys.all });
      void queryClient.invalidateQueries({ queryKey: produccionKeys.committee(data.id) });
    },
  });
}
