import { useSessionStore } from '@/stores/session.store';

const base = () => import.meta.env.VITE_PLANT_API_URL?.replace(/\/$/, '') ?? '';

export interface PlantApiErrorDetails {
  message?: string | string[];
  error?: string;
  fieldErrors?: Record<string, string>;
}

export class PlantApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly details?: PlantApiErrorDetails,
  ) {
    super(`Plant API ${status}: ${path}`);
    this.name = 'PlantApiError';
  }
}

export async function plantFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = base() ? `${base()}${path}` : path;
  const token = useSessionStore.getState().operator?.accessToken;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let details: PlantApiErrorDetails | undefined;
    try {
      details = (await res.json()) as PlantApiErrorDetails;
    } catch {
      details = undefined;
    }
    throw new PlantApiError(res.status, path, details);
  }
  return res.json() as Promise<T>;
}
