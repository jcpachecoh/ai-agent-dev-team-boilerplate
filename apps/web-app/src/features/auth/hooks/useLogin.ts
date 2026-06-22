import { useMutation, useQueryClient } from '@tanstack/react-query';

import { proveedoresKeys } from '@/features/proveedores/api/proveedores.keys';
import { setGraphqlAuthToken } from '@/lib/auth-token';

import { AuthApiError, loginWithEmailPassword } from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import { useLocationSession } from '../context/LocationSessionContext';
import type { LoginInput, LoginResponse } from '../types';

export function useLogin(options?: { onSuccess?: (result: LoginResponse) => void }) {
  const queryClient = useQueryClient();
  const { applyAuthSession } = useLocationSession();

  return useMutation({
    mutationFn: (input: LoginInput) => loginWithEmailPassword(input),
    onSuccess: (result) => {
      setGraphqlAuthToken(result.accessToken);
      applyAuthSession(result);
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.all });
      options?.onSuccess?.(result);
    },
  });
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'No pudimos iniciar sesión. Intente nuevamente.';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidLoginInput(email: string, password: string): boolean {
  return EMAIL_PATTERN.test(email.trim()) && password.length > 0;
}
