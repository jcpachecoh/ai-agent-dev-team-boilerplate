import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approveOvertimeRequest,
  fetchOvertimePeriodSummary,
  fetchOvertimeRequests,
  objectOvertimeRequest,
} from '../api/overtime.client';
import type { OvertimeInboxFilters } from '../types/overtime.types';

export const overtimeKeys = {
  all: ['overtime'] as const,
  inbox: (filters: OvertimeInboxFilters) => ['overtime', 'inbox', filters] as const,
  summary: (payrollPeriod: string) => ['overtime', 'summary', payrollPeriod] as const,
};

export function useOvertimeRequestsQuery(filters: OvertimeInboxFilters, enabled = true) {
  return useQuery({
    queryKey: overtimeKeys.inbox(filters),
    queryFn: () => fetchOvertimeRequests(filters),
    enabled,
  });
}

export function useOvertimePeriodSummaryQuery(payrollPeriod: string, enabled = true) {
  return useQuery({
    queryKey: overtimeKeys.summary(payrollPeriod),
    queryFn: () => fetchOvertimePeriodSummary(payrollPeriod),
    enabled: enabled && !!payrollPeriod,
  });
}

export function useApproveOvertimeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approveOvertimeRequest(id, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: overtimeKeys.all });
    },
  });
}

export function useObjectOvertimeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      objectOvertimeRequest(id, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: overtimeKeys.all });
    },
  });
}
