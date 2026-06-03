import { GraphQLClient } from 'graphql-request';

import { clearGraphqlAuthToken, getGraphqlAuthToken, isAuthenticated } from './auth-token';
import { getTenantId } from './tenant';

const DEFAULT_URL = '/graphql';
const REMOVED_GATEWAY_PORT = ':4000';

function resolveGraphqlEndpoint(configured: string): string {
  const trimmed = configured.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(path, window.location.origin).href;
  }
  return path;
}

export function getGraphqlEndpoint(): string {
  const raw = import.meta.env.VITE_GRAPHQL_URL;
  let configured = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_URL;
  if (import.meta.env.DEV && configured.includes(REMOVED_GATEWAY_PORT)) {
    console.warn(
      '[graphql] VITE_GRAPHQL_URL apunta al gateway eliminado (:4000). Usando /graphql vía proxy de Vite.',
    );
    configured = DEFAULT_URL;
  }
  const resolved = resolveGraphqlEndpoint(configured);
  // #region agent log
  let urlCtorOk = false;
  try {
    new URL(resolved);
    urlCtorOk = true;
  } catch {
    urlCtorOk = false;
  }
  fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '28e71d' },
    body: JSON.stringify({
      sessionId: '28e71d',
      location: 'graphql-client.ts:getGraphqlEndpoint',
      message: 'GraphQL endpoint resolved',
      data: {
        rawType: typeof raw,
        rawEmpty: raw === '',
        configuredIsRelative: !/^https?:\/\//i.test(configured),
        resolvedOrigin: resolved.split('/').slice(0, 3).join('/'),
        urlCtorOk,
        hypothesisId: 'H1',
      },
      timestamp: Date.now(),
      runId: 'post-fix',
    }),
  }).catch(() => {});
  // #endregion
  return resolved;
}

function createGraphqlClient(): GraphQLClient {
  return new GraphQLClient(getGraphqlEndpoint(), {
    headers: buildHeaders,
  });
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
    return await createGraphqlClient().request<T>(document, variables, headers);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7828/ingest/355d2ecf-3818-453c-8510-c7b3fe83712b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '28e71d' },
      body: JSON.stringify({
        sessionId: '28e71d',
        location: 'graphql-client.ts:graphqlRequest',
        message: 'graphqlRequest failed',
        data: {
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
          endpoint: getGraphqlEndpoint().split('/').slice(0, 3).join('/'),
          hypothesisId: 'H1',
        },
        timestamp: Date.now(),
        runId: 'post-fix',
      }),
    }).catch(() => {});
    // #endregion
    throw parseGraphqlError(error);
  }
}
