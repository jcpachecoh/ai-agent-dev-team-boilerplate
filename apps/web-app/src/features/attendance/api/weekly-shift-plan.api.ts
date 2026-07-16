import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import type { WeeklyShiftPlan } from '../types/weekly-shift-plan.types';

export class WeeklyShiftPlanApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'WeeklyShiftPlanApiError';
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

async function requestWeeklyShiftPlan(path: string, init?: RequestInit): Promise<WeeklyShiftPlan> {
  const token = getGraphqlAuthToken();
  const headers: HeadersInit = {
    'x-tenant-id': getTenantId(),
    ...(init?.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  if (init?.body && !(init.headers && 'Content-Type' in (init.headers as object))) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildApiUrl(path), { ...init, headers });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new WeeklyShiftPlanApiError('No autorizado', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const { message, parsed } = await parseErrorBody(body);
    throw new WeeklyShiftPlanApiError(message || 'Error en plan semanal', response.status, parsed);
  }

  return response.json() as Promise<WeeklyShiftPlan>;
}

export async function getOrCreateWeeklyShiftPlan(params: {
  locationId: string;
  weekStart: string;
}): Promise<WeeklyShiftPlan> {
  const search = new URLSearchParams({
    locationId: params.locationId,
    weekStart: params.weekStart,
  });
  return requestWeeklyShiftPlan(`/turnos/planes-semanales?${search.toString()}`);
}

export async function submitWeeklyShiftPlan(planId: string): Promise<WeeklyShiftPlan> {
  return requestWeeklyShiftPlan(`/turnos/planes-semanales/${planId}/submit`, {
    method: 'POST',
  });
}

export async function approveWeeklyShiftPlan(planId: string): Promise<WeeklyShiftPlan> {
  return requestWeeklyShiftPlan(`/turnos/planes-semanales/${planId}/approve`, {
    method: 'POST',
  });
}

export async function rejectWeeklyShiftPlan(
  planId: string,
  reason: string,
): Promise<WeeklyShiftPlan> {
  return requestWeeklyShiftPlan(`/turnos/planes-semanales/${planId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
