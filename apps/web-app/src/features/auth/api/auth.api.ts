import { GraphqlRequestError, graphqlRequest } from '@/lib/graphql-client';
import type {
  AuthUserProfile,
  LoginInput,
  LoginResponse,
  SignupInput,
  SignupResponse,
} from '../types';
import { LOGIN_MUTATION, LOGOUT_MUTATION, ME_QUERY, SIGNUP_MUTATION } from './auth.graphql';

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

export async function fetchCurrentUser(): Promise<AuthUserProfile> {
  try {
    const data = await graphqlRequest<{ me: AuthUserProfile }>(ME_QUERY);
    return data.me;
  } catch (error) {
    throw toAuthApiError(error, 'me');
  }
}

type AuthOperation = 'login' | 'signup' | 'logout' | 'me';

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
        'No se pudo conectar con la API. Inicia API + web-app: pnpm --filter @restopsiq/web-app run dev:stack (o en otra terminal: cd apps/api && pnpm start:dev). Revisa que no uses el gateway :4000 en .env.local.',
      );
    }
  }

  return new AuthApiError(
    operation === 'signup'
      ? 'No pudimos crear la cuenta. Intente nuevamente.'
      : operation === 'logout'
        ? 'No pudimos cerrar sesión. Intente nuevamente.'
        : operation === 'me'
          ? 'No pudimos cargar tu perfil. Intente nuevamente.'
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
  if (operation === 'me' && (status === 401 || error.code === 'UNAUTHENTICATED')) {
    return 'Sesión expirada. Inicia sesión de nuevo.';
  }
  if (error.message) {
    return error.message;
  }
  return operation === 'signup'
    ? 'No pudimos crear la cuenta. Intente nuevamente.'
    : operation === 'me'
      ? 'No pudimos cargar tu perfil. Intente nuevamente.'
      : 'No pudimos iniciar sesión. Intente nuevamente.';
}
