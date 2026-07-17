import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  approveOvertimeRequest,
  createAdministrativeOvertimeRequests,
  fetchOvertimePeriodSummary,
  fetchOvertimeRequests,
  objectOvertimeRequest,
} from '../api/overtime.client';
import type {
  CreateAdministrativeOvertimeBatchResult,
  CreateAdministrativeOvertimeRequestInput,
  OvertimeInboxFilters,
  OvertimeInboxResult,
  OvertimePeriodSummary,
  OvertimeRequestItem,
} from '../types/overtime.types';

export const overtimeKeys = {
  all: ['overtime'] as const,
  inbox: (filters: OvertimeInboxFilters) => ['overtime', 'inbox', filters] as const,
  summary: (payrollPeriod: string) => ['overtime', 'summary', payrollPeriod] as const,
};

export function useOvertimeRequestsQuery(
  filters: OvertimeInboxFilters,
  enabled = true,
): UseQueryResult<OvertimeInboxResult> {
  return useQuery({
    queryKey: overtimeKeys.inbox(filters),
    queryFn: () => fetchOvertimeRequests(filters),
    enabled,
  });
}

export function useOvertimePeriodSummaryQuery(
  payrollPeriod: string,
  enabled = true,
): UseQueryResult<OvertimePeriodSummary> {
  return useQuery({
    queryKey: overtimeKeys.summary(payrollPeriod),
    queryFn: () => fetchOvertimePeriodSummary(payrollPeriod),
    enabled: enabled && !!payrollPeriod,
  });
}

export function useApproveOvertimeMutation(): UseMutationResult<
  OvertimeRequestItem,
  Error,
  { id: string; comment?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approveOvertimeRequest(id, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: overtimeKeys.all });
    },
  });
}

export function useObjectOvertimeMutation(): UseMutationResult<
  OvertimeRequestItem,
  Error,
  { id: string; comment: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      objectOvertimeRequest(id, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: overtimeKeys.all });
    },
  });
}

export function useCreateAdministrativeOvertimeMutation(): UseMutationResult<
  CreateAdministrativeOvertimeBatchResult,
  Error,
  CreateAdministrativeOvertimeRequestInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdministrativeOvertimeRequestInput) =>
      createAdministrativeOvertimeRequests(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: overtimeKeys.all });
    },
  });
}
