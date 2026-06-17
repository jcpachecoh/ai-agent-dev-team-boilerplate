import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { logoutGlobalUser } from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import { proveedoresKeys } from '@/features/proveedores/api/proveedores.keys';
import { clearGraphqlAuthToken, isAuthenticated } from '@/lib/auth-token';

export function useLogout(): () => void {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useCallback(() => {
    const hadSession = isAuthenticated();

    void (async () => {
      if (hadSession) {
        try {
          await logoutGlobalUser();
        } catch {
          // Best-effort server logout; always clear local session.
        }
      }

      clearGraphqlAuthToken();
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({ queryKey: proveedoresKeys.all });
      navigate('/login', { replace: true });
    })();
  }, [navigate, queryClient]);
}
