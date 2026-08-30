import { getGraphqlAuthToken } from '@/lib/auth-token';

import { plantApiConfig } from './config';

export class PlantApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'PlantApiError';
  }
}

async function parseErrorMessage(body: string, fallback: string): Promise<string> {
  if (!body) return fallback;
  try {
    const parsed = JSON.parse(body) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join('. ');
    if (typeof parsed.message === 'string') return parsed.message;
  } catch {
    // plain text
  }
  return body.length > 200 ? fallback : body;
}

function buildPlantRequestUrl(path: string): string {
  const base = plantApiConfig.baseUrl.replace(/\/$/, '');
  return base ? `${base}/api${path}` : `/api${path}`;
}

function buildPlantAuthHeaders(init?: RequestInit, jsonBody = true): HeadersInit {
  const token = getGraphqlAuthToken();
  const headers: HeadersInit = {
    ...(jsonBody ? { 'Content-Type': 'application/json' } : {}),
    'x-tenant-id': plantApiConfig.tenantId,
    ...(init?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function handlePlantResponseError(response: Response): Promise<never> {
  if (response.status === 401) {
    window.location.href = '/login';
    throw new PlantApiError('No autorizado', 401);
  }

  const body = await response.text();
  const message = await parseErrorMessage(body, response.statusText);
  throw new PlantApiError(message, response.status);
}

export async function plantFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildPlantRequestUrl(path), {
    ...init,
    headers: buildPlantAuthHeaders(init),
  });

  if (!response.ok) {
    return handlePlantResponseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

/** Binary responses (e.g. PDF) — does not force JSON Content-Type. */
export async function plantFetchBlob(
  path: string,
  init?: RequestInit,
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await fetch(buildPlantRequestUrl(path), {
    ...init,
    headers: buildPlantAuthHeaders(init, false),
  });

  if (!response.ok) {
    return handlePlantResponseError(response);
  }

  const blob = await response.blob();
  const filename = parseFilenameFromContentDisposition(response.headers.get('Content-Disposition'));
  return { blob, filename };
}
