import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadTenantLogo } from '../api/empresa.upload';
import { empresaKeys } from '../api/empresa.keys';

export function useUploadTenantLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadTenantLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empresaKeys.tenant('me') });
    },
  });
}
