import { useMutation, useQueryClient } from '@tanstack/react-query';

import { assignDailyCostCenterManual } from '../api/daily-cost-center.client';
import { payrollKeys } from '../api/queryKeys';

export function useAssignDailyCostCenterManualMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, locationId }: { date: string; locationId: string }) =>
      assignDailyCostCenterManual(employeeId, date, locationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.dailyCostCenter() });
    },
  });
}
