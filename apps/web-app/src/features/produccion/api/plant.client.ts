import { loginMesOperational } from './mes-auth.api';
import { plantApiConfig } from './config';
import { clearMesAccessToken, getMesAccessToken } from './mes-token';

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

let mesLoginPromise: Promise<string> | null = null;

async function ensureMesAccessToken(): Promise<string> {
  const existing = getMesAccessToken();
  if (existing) return existing;

  if (!mesLoginPromise) {
    mesLoginPromise = loginMesOperational().finally(() => {
      mesLoginPromise = null;
    });
  }

  return mesLoginPromise;
}

export async function plantFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await ensureMesAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': plantApiConfig.tenantId,
    Authorization: `Bearer ${token}`,
    ...(init?.headers ?? {}),
  };

  const base = plantApiConfig.baseUrl.replace(/\/$/, '');
  const url = base ? `${base}/api${path}` : `/api${path}`;

  const response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    clearMesAccessToken();
    throw new PlantApiError('Sesión MES expirada. Recargue la página.', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const message = await parseErrorMessage(body, response.statusText);
    throw new PlantApiError(message, response.status);
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
  const token = await ensureMesAccessToken();
  const headers: HeadersInit = {
    'x-tenant-id': plantApiConfig.tenantId,
    Authorization: `Bearer ${token}`,
    ...(init?.headers ?? {}),
  };

  const base = plantApiConfig.baseUrl.replace(/\/$/, '');
  const url = base ? `${base}/api${path}` : `/api${path}`;

  const response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    clearMesAccessToken();
    throw new PlantApiError('Sesión MES expirada. Recargue la página.', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const message = await parseErrorMessage(body, response.statusText);
    throw new PlantApiError(message, response.status);
  }

  const blob = await response.blob();
  const filename = parseFilenameFromContentDisposition(response.headers.get('Content-Disposition'));
  return { blob, filename };
}
