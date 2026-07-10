import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchEmployeeDataConsentsGql, revokeDataConsentGql } from '../api/data-consent.graphql';
import { dataConsentKeys } from '../api/data-consent.keys';
import type { ConsentType } from '../types';

export function useEmployeeDataConsents(userId: string) {
  return useQuery({
    queryKey: dataConsentKeys.employee(userId),
    queryFn: () => fetchEmployeeDataConsentsGql(userId),
    enabled: Boolean(userId),
  });
}

export function useRevokeDataConsentMutation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consentType: ConsentType) => revokeDataConsentGql(consentType),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dataConsentKeys.employee(userId) });
    },
  });
}
