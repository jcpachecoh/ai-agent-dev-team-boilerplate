import { getGraphqlAuthToken } from '@/lib/auth-token';

import { inventoryApiConfig } from './config';

export class InventoryApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'InventoryApiError';
  }
}

export async function inventoryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getGraphqlAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': inventoryApiConfig.tenantId,
    ...(init?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const base = inventoryApiConfig.baseUrl.replace(/\/$/, '');
  const url = base ? `${base}/api${path}` : `/api${path}`;
  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new InventoryApiError('No autorizado', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new InventoryApiError(body || response.statusText, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
