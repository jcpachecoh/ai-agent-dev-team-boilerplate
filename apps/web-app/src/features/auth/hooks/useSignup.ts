import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AuthApiError, signupWithEmailPassword } from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import type { SignupInput, SignupResponse } from '../types';
import { proveedoresKeys } from '@/features/proveedores/api/proveedores.keys';
import { setGraphqlAuthToken } from '@/lib/auth-token';

import { useLocationSession } from '../context/LocationSessionContext';

export function useSignup(options?: { onSuccess?: (result: SignupResponse) => void }) {
  const queryClient = useQueryClient();
  const { applyAuthSession } = useLocationSession();

  return useMutation({
    mutationFn: (input: SignupInput) => signupWithEmailPassword(input),
    onSuccess: (result) => {
      setGraphqlAuthToken(result.accessToken);
      applyAuthSession(result);
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
      void queryClient.invalidateQueries({ queryKey: proveedoresKeys.all });
      options?.onSuccess?.(result);
    },
  });
}

export function getSignupErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'No pudimos crear la cuenta. Intente nuevamente.';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidSignupInput(email: string, cedula: string, password: string): boolean {
  return (
    EMAIL_PATTERN.test(email.trim()) &&
    cedula.trim().length > 0 &&
    cedula.trim().length <= 20 &&
    password.length >= 8 &&
    password.length <= 72
  );
}
