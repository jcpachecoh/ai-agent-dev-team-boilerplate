import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import type {
  AssignTurnoInput,
  TurnoAssignmentResponse,
  WeeklyAssignmentsQuery,
  WeeklyAssignmentsResponse,
} from '../types/turno-assignments.types';

export class TurnoAssignmentsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'TurnoAssignmentsApiError';
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

async function assignmentsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: buildHeaders(init),
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new TurnoAssignmentsApiError('No autorizado', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const { message, parsed } = await parseErrorBody(body);
    throw new TurnoAssignmentsApiError(message, response.status, parsed);
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

export function getWeeklyAssignments(
  query: WeeklyAssignmentsQuery,
): Promise<WeeklyAssignmentsResponse> {
  const params = toQueryString({
    weekStart: query.weekStart,
    search: query.search,
    field: query.field,
    page: query.page,
    limit: query.limit,
  });
  return assignmentsFetch<WeeklyAssignmentsResponse>(`/turnos/asignaciones${params}`);
}

export function assignTurno(input: AssignTurnoInput): Promise<TurnoAssignmentResponse> {
  return assignmentsFetch<TurnoAssignmentResponse>('/turnos/asignaciones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteAssignment(id: string): Promise<void> {
  return assignmentsFetch<void>(`/turnos/asignaciones/${id}`, { method: 'DELETE' });
}
