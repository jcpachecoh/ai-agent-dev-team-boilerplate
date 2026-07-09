import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  registerMedicalLeave,
  updateMedicalLeaveStatus,
  uploadMedicalLeaveSupportDocument,
} from '../api/medical-leaves.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  CreateMedicalLeaveInput,
  ListMedicalLeavesFilters,
  UpdateMedicalLeaveStatusInput,
} from '../types/medical-leaves.types';

export function useMedicalLeaveMutations(listFilters: ListMedicalLeavesFilters = {}) {
  const qc = useQueryClient();

  const invalidate = async (leaveId?: string) => {
    await qc.invalidateQueries({ queryKey: payrollKeys.medicalLeaveList(listFilters) });
    if (leaveId) {
      await qc.invalidateQueries({ queryKey: payrollKeys.medicalLeaveDetail(leaveId) });
    }
  };

  const registerMutation = useMutation({
    mutationFn: (input: CreateMedicalLeaveInput) => registerMedicalLeave(input),
    onSuccess: async (data) => {
      await invalidate(data.id);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMedicalLeaveStatusInput }) =>
      updateMedicalLeaveStatus(id, input),
    onSuccess: async (data) => {
      await invalidate(data.id);
    },
  });

  const uploadSupportMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadMedicalLeaveSupportDocument(id, file),
    onSuccess: async (data) => {
      await invalidate(data.id);
    },
  });

  return {
    registerMutation,
    updateStatusMutation,
    uploadSupportMutation,
  };
}
