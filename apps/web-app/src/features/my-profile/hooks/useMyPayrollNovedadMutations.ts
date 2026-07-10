import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  submitPayrollNovedad,
  uploadPayrollNovedadSupportDraft,
} from '@/features/payroll/api/payroll-novedades.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';
import type {
  ListMyPayrollNovedadesFilters,
  SubmitPayrollNovedadInput,
} from '@/features/payroll/types/payroll-novedades.types';

export interface SubmitMyPayrollNovedadInput {
  employeeId: string;
  type: SubmitPayrollNovedadInput['type'];
  startDate: string;
  endDate: string;
  notes?: string;
  supportStorageObjectId?: string;
  supportFile?: File;
  overlapWarningAck?: boolean;
}

export function useMyPayrollNovedadMutations(listFilters: ListMyPayrollNovedadesFilters = {}) {
  const qc = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (input: SubmitMyPayrollNovedadInput) => {
      let supportStorageObjectId = input.supportStorageObjectId;
      if (input.supportFile) {
        const uploaded = await uploadPayrollNovedadSupportDraft(
          input.employeeId,
          input.supportFile,
        );
        supportStorageObjectId = uploaded.id;
      }

      return submitPayrollNovedad({
        employeeId: input.employeeId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
        supportStorageObjectId,
        requestedBy: 'EMPLEADO',
        overlapWarningAck: input.overlapWarningAck,
        autoApprove: false,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: payrollKeys.myPayrollNovedades(listFilters) });
    },
  });

  return { submitMutation };
}
