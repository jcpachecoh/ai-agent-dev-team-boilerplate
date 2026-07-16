import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  downloadPilaExport,
  generatePilaExport,
  getPilaDeadline,
  listPilaExports,
  markPilaExportPaid,
  validatePilaPeriod,
  voidPilaExport,
} from '../api/pila.client';
import { payrollKeys } from '../api/queryKeys';
import type {
  MarkPilaExportPaidInput,
  PilaDeadlineResponse,
  PilaDownloadResult,
  PilaExportFormat,
  PilaPeriodExport,
  PilaValidationResponse,
  VoidPilaExportInput,
} from '../types/pila.types';

export function usePilaExportsQuery(period: string): UseQueryResult<PilaPeriodExport[]> {
  return useQuery({
    queryKey: payrollKeys.pilaList(period),
    queryFn: () => listPilaExports({ period }),
    enabled: /^\d{4}-(0[1-9]|1[0-2])$/.test(period),
  });
}

export function usePilaValidationQuery(
  period: string,
  enabled = true,
): UseQueryResult<PilaValidationResponse> {
  return useQuery({
    queryKey: payrollKeys.pilaValidation(period),
    queryFn: () => validatePilaPeriod(period),
    enabled: enabled && /^\d{4}-(0[1-9]|1[0-2])$/.test(period),
  });
}

export function usePilaDeadlineQuery(
  period: string,
  enabled = true,
): UseQueryResult<PilaDeadlineResponse> {
  return useQuery({
    queryKey: payrollKeys.pilaDeadline(period),
    queryFn: () => getPilaDeadline(period),
    enabled: enabled && /^\d{4}-(0[1-9]|1[0-2])$/.test(period),
  });
}

function useInvalidatePila(period: string): () => Promise<void> {
  const queryClient = useQueryClient();
  return async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: payrollKeys.pilaList(period) }),
      queryClient.invalidateQueries({ queryKey: payrollKeys.pilaValidation(period) }),
      queryClient.invalidateQueries({ queryKey: payrollKeys.pilaDeadline(period) }),
    ]);
  };
}

export function useGeneratePilaMutation(
  period: string,
): UseMutationResult<PilaPeriodExport, Error, PilaExportFormat | void> {
  const invalidate = useInvalidatePila(period);
  return useMutation({
    mutationFn: (format: PilaExportFormat | void = 'TXT') =>
      generatePilaExport(period, format ?? 'TXT'),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useMarkPilaPaidMutation(
  period: string,
): UseMutationResult<
  PilaPeriodExport,
  Error,
  { exportId: string; input: MarkPilaExportPaidInput }
> {
  const invalidate = useInvalidatePila(period);
  return useMutation({
    mutationFn: ({ exportId, input }: { exportId: string; input: MarkPilaExportPaidInput }) =>
      markPilaExportPaid(exportId, input),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useVoidPilaMutation(
  period: string,
): UseMutationResult<PilaPeriodExport, Error, { exportId: string; input: VoidPilaExportInput }> {
  const invalidate = useInvalidatePila(period);
  return useMutation({
    mutationFn: ({ exportId, input }: { exportId: string; input: VoidPilaExportInput }) =>
      voidPilaExport(exportId, input),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useDownloadPilaMutation(): UseMutationResult<PilaDownloadResult, Error, string> {
  return useMutation({
    mutationFn: (exportId: string) => downloadPilaExport(exportId),
  });
}
