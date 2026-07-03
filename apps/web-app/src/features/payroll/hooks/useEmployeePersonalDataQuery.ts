import { useQuery } from '@tanstack/react-query';

import { getEmployeePersonalData } from '../api/personal-data.client';

export function useEmployeePersonalDataQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['payroll', 'personal-data', userId],
    queryFn: () => getEmployeePersonalData(userId!),
    enabled: Boolean(userId),
  });
}
