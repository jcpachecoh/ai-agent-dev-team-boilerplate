import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getEmployeeTaxInformation,
  upsertEmployeeTaxInformation,
} from '../api/financial-profile.client';
import { payrollKeys } from '../api/queryKeys';
import type { UpsertTaxInformationInput } from '../types/financial-profile.types';

export function useEmployeeTaxInformationQuery(employeeId: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.taxInformation(employeeId ?? ''),
    queryFn: () => getEmployeeTaxInformation(employeeId!),
    enabled: Boolean(employeeId),
  });
}

export function useEmployeeTaxInformationMutation(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertTaxInformationInput) =>
      upsertEmployeeTaxInformation(employeeId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.taxInformation(employeeId) });
    },
  });
}
