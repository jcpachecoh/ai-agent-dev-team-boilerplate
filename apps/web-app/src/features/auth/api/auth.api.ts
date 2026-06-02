import { gql } from 'graphql-request';

import { graphqlClient } from '@/lib/graphql-client';
import { getTenantId } from '@/lib/tenant';
import type { LoginInput, LoginResponse } from '../types';

const LOGIN_MUTATION = gql`
  mutation Login($cedula: String!, $pin: String!, $tenantId: String!) {
    login(cedula: $cedula, pin: $pin, tenantId: $tenantId) {
      token
      user {
        id
        role
        tenantId
        sedeId
        isActive
      }
    }
  }
`;

interface LoginMutationResult {
  login: LoginResponse;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export async function loginWithCedulaPin(input: LoginInput): Promise<LoginResponse> {
  try {
    const data = await graphqlClient.request<LoginMutationResult>(LOGIN_MUTATION, {
      cedula: input.cedula,
      pin: input.pin,
      tenantId: getTenantId(),
    });
    return data.login;
  } catch (err: unknown) {
    const message = extractGraphqlErrorMessage(err);
    throw new AuthApiError(message);
  }
}

function extractGraphqlErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // graphql-request wraps errors in err.response.errors
    const response = (err as Record<string, unknown>).response;
    if (response && typeof response === 'object') {
      const errors = (response as Record<string, unknown>).errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0] as Record<string, unknown>;
        const code = (first.extensions as Record<string, unknown> | undefined)?.code;
        if (code === 'UNAUTHENTICATED') return 'Cédula o PIN incorrecto.';
        if (code === 'FORBIDDEN') return 'Usuario sin acceso autorizado.';
        if (typeof first.message === 'string') return first.message;
      }
    }
    if (err instanceof Error && err.message?.includes('fetch')) {
      return 'No se pudo conectar con el servidor. Comprueba que el gateway esté en ejecución (puerto 4000).';
    }
  }
  return 'No pudimos iniciar sesión. Intente nuevamente.';
}
