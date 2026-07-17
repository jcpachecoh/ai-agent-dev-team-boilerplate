import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import { AttendanceApiError } from './attendance.client';
import type {
  CreateAdministrativeOvertimeBatchResult,
  CreateAdministrativeOvertimeRequestInput,
  OvertimeInboxFilters,
  OvertimeInboxResult,
  OvertimePeriodSummary,
  OvertimeRequestItem,
} from '../types/overtime.types';

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  return '';
}

function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}/api${path}` : `/api${path}`;
}

function parseErrorMessage(body: string, fallback: string): string {
  if (!body) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(body) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) {
      return parsed.message.join('. ');
    }
    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    // plain text
  }
  return body.length > 240 ? fallback : body;
}

async function overtimeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getGraphqlAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': getTenantId(),
    ...(init?.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(path), { ...init, headers });
  if (response.status === 401) {
    window.location.href = '/login';
    throw new AttendanceApiError('No autorizado', 401);
  }
  if (!response.ok) {
    const body = await response.text();
    const message = parseErrorMessage(body, response.statusText);
    throw new AttendanceApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export function fetchOvertimeRequests(
  filters: OvertimeInboxFilters = {},
): Promise<OvertimeInboxResult> {
  const status = filters.status?.join(',');
  return overtimeFetch<OvertimeInboxResult>(
    `/attendance/overtime-requests${toQueryString({
      payrollPeriod: filters.payrollPeriod,
      locationId: filters.locationId,
      employeeId: filters.employeeId,
      cursor: filters.cursor,
      take: filters.take,
      status,
    })}`,
  );
}

export function fetchOvertimePeriodSummary(payrollPeriod: string): Promise<OvertimePeriodSummary> {
  return overtimeFetch<OvertimePeriodSummary>(
    `/attendance/overtime-requests/summary${toQueryString({ payrollPeriod })}`,
  );
}

export function approveOvertimeRequest(id: string, comment?: string): Promise<OvertimeRequestItem> {
  return overtimeFetch<OvertimeRequestItem>(`/attendance/overtime-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

export function objectOvertimeRequest(id: string, comment: string): Promise<OvertimeRequestItem> {
  return overtimeFetch<OvertimeRequestItem>(`/attendance/overtime-requests/${id}/object`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

export function createAdministrativeOvertimeRequests(
  input: CreateAdministrativeOvertimeRequestInput,
): Promise<CreateAdministrativeOvertimeBatchResult> {
  return overtimeFetch<CreateAdministrativeOvertimeBatchResult>(
    '/attendance/overtime-requests/administrative',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}
