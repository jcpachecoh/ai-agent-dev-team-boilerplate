import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  bulkAssignDotacionByPosition,
  createDotacionForEmployee,
  generatePeriodEntitlements,
  markDotacionNotApplicable,
  registerDotacionDelivery,
  updateDotacionDelivery,
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
    onSuccess: (delivery) => {
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionPeriod(period, locationId) });
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionAvailableItems() });
      void qc.invalidateQueries({
        queryKey: payrollKeys.dotacionEmployeeHistory(delivery.employeeId),
      });
    },
  });
}

export function useEmployeeDotacionRegisterMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerDotacionDelivery,
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: payrollKeys.dotacionEmployeeHistory(employeeId),
      });
      void qc.invalidateQueries({ queryKey: payrollKeys.dotacionAvailableItems() });
    },
  });
}

export function useCreateDotacionForEmployeeMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (period: string) => createDotacionForEmployee(employeeId, period),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: payrollKeys.dotacionEmployeeHistory(employeeId),
      });
    },
  });
}

export function useUpdateDotacionMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { deliveredAt?: string; signedReceiptUrl?: string | null };
    }) => updateDotacionDelivery(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: payrollKeys.dotacionEmployeeHistory(employeeId),
      });
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
