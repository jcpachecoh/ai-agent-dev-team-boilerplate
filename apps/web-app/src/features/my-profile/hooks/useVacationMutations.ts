import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  approveVacationLevel1,
  approveVacationLevel2,
  createVacationRequest,
  getVacationLetterUrl,
  rejectVacation,
} from '@/features/payroll/api/vacations.client';
import { payrollKeys } from '@/features/payroll/api/queryKeys';
import type { CreateVacationRequestInput } from '@/features/payroll/types/vacations.types';

export function useRequestVacationMutation(employeeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateVacationRequestInput, 'employeeId'>) =>
      createVacationRequest({ ...input, employeeId: employeeId! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.vacations() });
    },
  });
}

export function useVacationApprovalMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: payrollKeys.vacations() });

  const approveL1 = useMutation({
    mutationFn: approveVacationLevel1,
    onSuccess: invalidate,
  });
  const approveL2 = useMutation({
    mutationFn: approveVacationLevel2,
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: ({ requestId, rejectionReason }: { requestId: string; rejectionReason: string }) =>
      rejectVacation(requestId, rejectionReason),
    onSuccess: invalidate,
  });
  const letterUrl = useMutation({
    mutationFn: getVacationLetterUrl,
  });

  return { approveL1, approveL2, reject, letterUrl };
}
