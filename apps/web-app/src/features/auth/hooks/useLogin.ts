import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AuthApiError, loginWithCedulaPin } from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import type { LoginInput, LoginResponse } from '../types';
import { proveedoresKeys } from '@/features/proveedores/api/proveedores.keys';
import { setGraphqlAuthToken } from '@/lib/auth-token';

export function useLogin(options?: { onSuccess?: (result: LoginResponse) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => loginWithCedulaPin(input),
    onSuccess: (result) => {
      setGraphqlAuthToken(result.token);
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

export function isValidLoginInput(cedula: string, pin: string): boolean {
  return /^\d{8,11}$/.test(cedula) && /^\d{4,6}$/.test(pin);
}
