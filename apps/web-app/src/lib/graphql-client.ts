import { GraphQLClient } from 'graphql-request';

import { clearGraphqlAuthToken, getGraphqlAuthToken, isAuthenticated } from './auth-token';
import { getTenantId } from './tenant';

const DEFAULT_URL = import.meta.env.DEV ? '/graphql' : 'http://localhost:4000/graphql';

export function getGraphqlEndpoint(): string {
  return import.meta.env.VITE_GRAPHQL_URL ?? DEFAULT_URL;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': getTenantId(),
  };
  const token = getGraphqlAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export const graphqlClient = new GraphQLClient(getGraphqlEndpoint(), {
  headers: buildHeaders,
});

/** True when the user has a session JWT from global login (sent as Bearer on GraphQL). */
export function isGraphqlConfigured(): boolean {
  return isAuthenticated();
}

export class GraphqlRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'GraphqlRequestError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof GraphqlRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
}

interface GraphqlClientErrorShape {
  response?: {
    errors?: Array<{
      message?: string;
      extensions?: { code?: string };
    }>;
  };
}

export function parseGraphqlError(error: unknown): GraphqlRequestError {
  if (error instanceof GraphqlRequestError) return error;

  const response = (error as GraphqlClientErrorShape).response;
  const first = response?.errors?.[0];
  if (first?.extensions?.code === 'UNAUTHENTICATED') {
    clearGraphqlAuthToken();
  }
  if (first?.message) {
    return new GraphqlRequestError(first.message, first.extensions?.code);
  }

  if (error instanceof Error) {
    return new GraphqlRequestError(error.message);
  }

  return new GraphqlRequestError('Error de red al contactar el servidor');
}

export async function graphqlRequest<T>(
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const headers = buildHeaders();
  try {
    return await graphqlClient.request<T>(document, variables, headers);
  } catch (error) {
    throw parseGraphqlError(error);
  }
}
