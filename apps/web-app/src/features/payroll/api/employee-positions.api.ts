import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import { PayrollApiError } from './payroll.client';
import type {
  CreateEmployeePositionInput,
  EmployeePosition,
  ListEmployeePositionsFilters,
  UpdateEmployeePositionInput,
} from '../types/employee-position.types';

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

function buildPayrollUrl(path: string): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  const base = typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.replace(/\/$/, '') : '';
  return base ? `${base}/api${path}` : `/api${path}`;
}

async function positionsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getGraphqlAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': getTenantId(),
    ...(init?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildPayrollUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new PayrollApiError(body || response.statusText, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function listEmployeePositions(
  filters: ListEmployeePositionsFilters = {},
): Promise<EmployeePosition[]> {
  const query = toQueryString({
    includeInactive: filters.includeInactive,
    area: filters.area,
    search: filters.search,
  });
  return positionsFetch<EmployeePosition[]>(`/employee-positions${query}`);
}

export function getEmployeePosition(id: string): Promise<EmployeePosition> {
  return positionsFetch<EmployeePosition>(`/employee-positions/${id}`);
}

export function createEmployeePosition(
  input: CreateEmployeePositionInput,
): Promise<EmployeePosition> {
  return positionsFetch<EmployeePosition>('/employee-positions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateEmployeePosition(
  id: string,
  input: UpdateEmployeePositionInput,
): Promise<EmployeePosition> {
  return positionsFetch<EmployeePosition>(`/employee-positions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deactivateEmployeePosition(id: string): Promise<EmployeePosition> {
  return positionsFetch<EmployeePosition>(`/employee-positions/${id}/deactivate`, {
    method: 'PATCH',
  });
}
