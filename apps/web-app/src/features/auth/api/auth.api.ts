import { GraphqlRequestError, graphqlRequest } from '@/lib/graphql-client';
import type {
  AssignedLocationSummary,
  AuthUserProfile,
  LoginInput,
  LoginResponse,
  SignupInput,
  SignupResponse,
} from '../types';
import {
  ADMIN_USER_NAME_QUERY,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  ME_QUERY_LEGACY,
  MY_LOCATIONS_QUERY,
  SELECT_USER_LOCATION_MUTATION,
  RESET_PASSWORD_MUTATION,
  SIGNUP_MUTATION,
} from './auth.graphql';

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
    if (!isMissingGraphqlFieldError(error, 'name')) {
      throw toAuthApiError(error, 'me');
    }

    const data = await graphqlRequest<{ me: AuthUserProfile }>(ME_QUERY_LEGACY);
    const name = await fetchAdminUserName(data.me.id);
    return { ...data.me, name };
  }
}

async function fetchAdminUserName(userId: string): Promise<string | null> {
  try {
    const data = await graphqlRequest<{ adminUser: { name: string } | null }>(
      ADMIN_USER_NAME_QUERY,
      { id: userId },
    );
    const name = data.adminUser?.name?.trim();
    return name ? name : null;
  } catch {
    return null;
  }
}

function isMissingGraphqlFieldError(error: unknown, fieldName: string): boolean {
  if (!(error instanceof GraphqlRequestError)) return false;
  if (error.code !== 'GRAPHQL_VALIDATION_FAILED') return false;
  return error.message.includes(`Cannot query field "${fieldName}"`);
}

export async function fetchMyLocations(): Promise<AssignedLocationSummary[]> {
  try {
    const data = await graphqlRequest<{ myLocations: AssignedLocationSummary[] }>(
      MY_LOCATIONS_QUERY,
    );
    return data.myLocations;
  } catch (error) {
    throw toAuthApiError(error, 'myLocations');
  }
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  try {
    const data = await graphqlRequest<{ resetPassword: { message: string } }>(
      RESET_PASSWORD_MUTATION,
      {
        input: { token, newPassword },
      },
    );
    return data.resetPassword;
  } catch (error) {
    throw toAuthApiError(error, 'resetPassword');
  }
}

export async function selectUserLocation(locationId: string): Promise<LoginResponse> {
  try {
    const data = await graphqlRequest<{ selectUserLocation: LoginResponse }>(
      SELECT_USER_LOCATION_MUTATION,
      { input: { locationId } },
    );
    return data.selectUserLocation;
  } catch (error) {
    throw toAuthApiError(error, 'selectLocation');
  }
}

type AuthOperation =
  | 'login'
  | 'signup'
  | 'logout'
  | 'me'
  | 'myLocations'
  | 'selectLocation'
  | 'resetPassword';

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
  if (operation === 'resetPassword' && status === 400) {
    return error.message || 'El enlace de confirmación no es válido o expiró.';
  }
  if (operation === 'me' && (status === 401 || error.code === 'UNAUTHENTICATED')) {
    return 'Sesión expirada. Inicia sesión de nuevo.';
  }
  if (operation === 'selectLocation' && (status === 403 || error.code === 'FORBIDDEN')) {
    return 'La sede seleccionada no está asignada a tu usuario.';
  }
  if (operation === 'myLocations' && (status === 401 || error.code === 'UNAUTHENTICATED')) {
    return 'Sesión expirada. Inicia sesión de nuevo.';
  }
  if (error.message) {
    return error.message;
  }
  return operation === 'signup'
    ? 'No pudimos crear la cuenta. Intente nuevamente.'
    : operation === 'resetPassword'
      ? 'No pudimos configurar la contraseña. Intente nuevamente.'
      : operation === 'me'
        ? 'No pudimos cargar tu perfil. Intente nuevamente.'
        : 'No pudimos iniciar sesión. Intente nuevamente.';
}
