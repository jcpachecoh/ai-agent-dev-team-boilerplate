import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateTenant } from '../api/empresa.mutations';
import { empresaKeys } from '../api/empresa.keys';

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaKeys.tenant('me') });
    },
  });
}
