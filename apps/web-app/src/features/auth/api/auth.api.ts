import { GraphqlRequestError, graphqlRequest } from '@/lib/graphql-client';
import type { LoginInput, LoginResponse, SignupInput, SignupResponse } from '../types';
import { LOGIN_MUTATION, LOGOUT_MUTATION, SIGNUP_MUTATION } from './auth.graphql';

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export async function loginWithEmailPassword(input: LoginInput): Promise<LoginResponse> {
  try {
    const data = await graphqlRequest<{ login: LoginResponse }>(LOGIN_MUTATION, {
      input: {
        email: input.email,
        password: input.password,
      },
    });
    return data.login;
  } catch (error) {
    throw toAuthApiError(error, 'login');
  }
}

export async function signupWithEmailPassword(input: SignupInput): Promise<SignupResponse> {
  try {
    const data = await graphqlRequest<{ signup: SignupResponse }>(SIGNUP_MUTATION, {
      input: {
        email: input.email,
        password: input.password,
        cedula: input.cedula,
        documentType: input.documentType,
      },
    });
    return data.signup;
  } catch (error) {
    throw toAuthApiError(error, 'signup');
  }
}

export async function logoutGlobalUser(): Promise<void> {
  try {
    await graphqlRequest<{ logout: boolean }>(LOGOUT_MUTATION);
  } catch (error) {
    throw toAuthApiError(error, 'logout');
  }
}

type AuthOperation = 'login' | 'signup' | 'logout';

function toAuthApiError(error: unknown, operation: AuthOperation): AuthApiError {
  if (error instanceof GraphqlRequestError) {
    const status = mapGraphqlCodeToStatus(error.code);
    const message = mapGraphqlMessage(error, operation, status);
    return new AuthApiError(message, status);
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
      return new AuthApiError(
        'No se pudo conectar con el gateway GraphQL. Inicia el gateway (puerto 4000): cd apps/gateway && pnpm dev',
      );
    }
  }

  return new AuthApiError(
    operation === 'signup'
      ? 'No pudimos crear la cuenta. Intente nuevamente.'
      : operation === 'logout'
        ? 'No pudimos cerrar sesión. Intente nuevamente.'
        : 'No pudimos iniciar sesión. Intente nuevamente.',
  );
}

function mapGraphqlCodeToStatus(code?: string): number | undefined {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'CONFLICT':
      return 409;
    case 'BAD_USER_INPUT':
    case 'VALIDATION_ERROR':
      return 400;
    default:
      return undefined;
  }
}

function mapGraphqlMessage(
  error: GraphqlRequestError,
  operation: AuthOperation,
  status?: number,
): string {
  if (operation === 'login' && (status === 401 || error.code === 'UNAUTHENTICATED')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (status === 403 || error.code === 'FORBIDDEN') {
    return 'Usuario sin acceso autorizado.';
  }
  if (operation === 'signup' && status === 409) {
    return 'Correo o cédula ya registrados.';
  }
  if (operation === 'signup' && status === 400) {
    return error.message || 'Datos de registro inválidos. Revisa los campos e intenta de nuevo.';
  }
  if (error.message) {
    return error.message;
  }
  return operation === 'signup'
    ? 'No pudimos crear la cuenta. Intente nuevamente.'
    : 'No pudimos iniciar sesión. Intente nuevamente.';
}
