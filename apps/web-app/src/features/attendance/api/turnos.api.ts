import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import type {
  CreateTurnoInput,
  Turno,
  TurnosListQuery,
  TurnosListResponse,
  UpdateTurnoInput,
} from '../types/turnos.types';

export class TurnosApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'TurnosApiError';
  }
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

async function parseErrorBody(body: string): Promise<{ message: string; parsed?: unknown }> {
  if (!body) return { message: 'Error desconocido' };
  try {
    const parsed = JSON.parse(body) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return { message: parsed.message.join('. '), parsed };
    if (typeof parsed.message === 'string') return { message: parsed.message, parsed };
    return { message: body, parsed };
  } catch {
    return { message: body.length > 240 ? 'Error desconocido' : body };
  }
}

function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  return '';
}

function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}/api${path}` : `/api${path}`;
}

function buildHeaders(init?: RequestInit): HeadersInit {
  const token = getGraphqlAuthToken();
  const headers: HeadersInit = {
    'x-tenant-id': getTenantId(),
    ...(init?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const hasContentType =
    init?.headers &&
    typeof init.headers === 'object' &&
    ('Content-Type' in init.headers || 'content-type' in init.headers);

  if (!hasContentType && init?.body) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  return headers;
}

async function turnosFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: buildHeaders(init),
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new TurnosApiError('No autorizado', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const { message, parsed } = await parseErrorBody(body);
    throw new TurnosApiError(message, response.status, parsed);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body.trim()) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

async function turnosFetchBlob(path: string, init?: RequestInit): Promise<Blob | null> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: buildHeaders(init),
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new TurnosApiError('No autorizado', 401);
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    const { message, parsed } = await parseErrorBody(body);
    throw new TurnosApiError(message, response.status, parsed);
  }

  return response.blob();
}

export function listTurnos(query: TurnosListQuery = {}): Promise<TurnosListResponse> {
  const params = toQueryString({
    estado: query.estado,
    search: query.search,
    nombre: query.nombre,
    sigla: query.sigla,
    tipo: query.tipo,
    jornada: query.jornada,
    page: query.page,
    limit: query.limit,
  });
  return turnosFetch<TurnosListResponse>(`/turnos${params}`);
}

export function createTurno(input: CreateTurnoInput): Promise<Turno> {
  return turnosFetch<Turno>('/turnos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTurno(id: string, input: UpdateTurnoInput): Promise<Turno> {
  return turnosFetch<Turno>(`/turnos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function updateTurnoEstado(id: string, estado: boolean): Promise<Turno> {
  return turnosFetch<Turno>(`/turnos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

export function exportTurnosExcel(
  query: Omit<TurnosListQuery, 'page' | 'limit'> = {},
): Promise<Blob | null> {
  const params = toQueryString({
    formato: 'excel',
    estado: query.estado,
    search: query.search,
    nombre: query.nombre,
    sigla: query.sigla,
    tipo: query.tipo,
    jornada: query.jornada,
  });
  return turnosFetchBlob(`/turnos/exportar${params}`);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
