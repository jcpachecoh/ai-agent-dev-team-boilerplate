import { useMutation, useQueryClient } from '@tanstack/react-query';

import { attendanceKeys } from '../api/queryKeys';
import {
  approveWeeklyShiftPlan,
  rejectWeeklyShiftPlan,
  submitWeeklyShiftPlan,
} from '../api/weekly-shift-plan.api';

function invalidatePlanQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({
    queryKey: [...attendanceKeys.all, 'weekly-shift-plan'],
  });
}

export function useSubmitWeeklyShiftPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => submitWeeklyShiftPlan(planId),
    onSuccess: async () => {
      await invalidatePlanQueries(queryClient);
    },
  });
}

export function useApproveWeeklyShiftPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => approveWeeklyShiftPlan(planId),
    onSuccess: async () => {
      await invalidatePlanQueries(queryClient);
    },
  });
}

export function useRejectWeeklyShiftPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { planId: string; reason: string }) =>
      rejectWeeklyShiftPlan(input.planId, input.reason),
    onSuccess: async () => {
      await invalidatePlanQueries(queryClient);
    },
  });
}
