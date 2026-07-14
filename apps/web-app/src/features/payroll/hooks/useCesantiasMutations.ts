import { useMutation, useQueryClient } from '@tanstack/react-query';

import { calculateCesantias } from '../api/cesantias.client';
import { payrollKeys } from '../api/queryKeys';

export function useCesantiasMutations() {
  const qc = useQueryClient();

  const calculateMutation = useMutation({
    mutationFn: (year: number) => calculateCesantias(year),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: payrollKeys.cesantias() });
    },
  });

  return { calculateMutation };
}
