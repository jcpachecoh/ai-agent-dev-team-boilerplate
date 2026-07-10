import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  approvePayrollNovedadRrhh,
  approvePayrollNovedadSupervisor,
  rejectPayrollNovedadRrhh,
  rejectPayrollNovedadSupervisor,
  submitPayrollNovedad,
  uploadPayrollNovedadSupport,
} from '../api/payroll-novedades.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  ListPayrollNovedadesFilters,
  RejectPayrollNovedadInput,
  SubmitPayrollNovedadInput,
} from '../types/payroll-novedades.types';

export function usePayrollNovedadMutations(listFilters: ListPayrollNovedadesFilters = {}) {
  const qc = useQueryClient();

  const invalidate = async (id?: string) => {
    await qc.invalidateQueries({ queryKey: payrollKeys.payrollNovedadList(listFilters) });
    if (id) {
      await qc.invalidateQueries({ queryKey: payrollKeys.payrollNovedadDetail(id) });
    }
  };

  const submitMutation = useMutation({
    mutationFn: (input: SubmitPayrollNovedadInput) => submitPayrollNovedad(input),
    onSuccess: async (data) => {
      await invalidate(data.novedad.id);
    },
  });

  const approveSupervisorMutation = useMutation({
    mutationFn: (id: string) => approvePayrollNovedadSupervisor(id),
    onSuccess: async (data) => invalidate(data.id),
  });

  const rejectSupervisorMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectPayrollNovedadInput }) =>
      rejectPayrollNovedadSupervisor(id, input),
    onSuccess: async (data) => invalidate(data.id),
  });

  const approveRrhhMutation = useMutation({
    mutationFn: (id: string) => approvePayrollNovedadRrhh(id),
    onSuccess: async (data) => invalidate(data.id),
  });

  const rejectRrhhMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectPayrollNovedadInput }) =>
      rejectPayrollNovedadRrhh(id, input),
    onSuccess: async (data) => invalidate(data.id),
  });

  const uploadSupportMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadPayrollNovedadSupport(id, file),
    onSuccess: async (data) => invalidate(data.id),
  });

  return {
    submitMutation,
    approveSupervisorMutation,
    rejectSupervisorMutation,
    approveRrhhMutation,
    rejectRrhhMutation,
    uploadSupportMutation,
  };
}
