import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { proveedoresKeys } from '@/features/proveedores/api/proveedores.keys';
import { clearGraphqlAuthToken } from '@/lib/auth-token';

export function useLogout(): () => void {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useCallback(() => {
    clearGraphqlAuthToken();
    queryClient.removeQueries({ queryKey: proveedoresKeys.all });
    navigate('/login', { replace: true });
  }, [navigate, queryClient]);
}
