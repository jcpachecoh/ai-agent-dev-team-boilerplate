import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  bulkAssignDotacionByPosition,
  generatePeriodEntitlements,
  markDotacionNotApplicable,
  registerDotacionDelivery,
} from '../api/dotaciones.graphql';
import { payrollKeys } from '../api/queryKeys';

export function useGenerateEntitlementsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (period: string) => generatePeriodEntitlements(period),
    onSuccess: (_data, period) => {
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionPeriod(period) });
    },
  });
}

export function useRegisterDotacionMutation(period: string, locationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerDotacionDelivery,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionPeriod(period, locationId) });
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionAvailableItems() });
    },
  });
}

export function useBulkAssignByPositionMutation(period: string, locationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkAssignDotacionByPosition,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionPeriod(period, locationId) });
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionAvailableItems() });
    },
  });
}

export function useMarkNotApplicableMutation(period: string, locationId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      markDotacionNotApplicable(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionPeriod(period, locationId) });
    },
  });
}
