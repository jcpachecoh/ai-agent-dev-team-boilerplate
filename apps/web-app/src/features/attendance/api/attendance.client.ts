import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import type {
  AttendanceActiveEntry,
  AttendanceComparisonFilters,
  AttendanceComparisonSummary,
  AttendanceControlPanelFilters,
  AttendanceControlPanelSummary,
  AttendanceEntryInput,
  AttendanceEntryResult,
  AttendanceExitInput,
  AttendanceExitResult,
  AttendanceHistoryFilters,
  AttendanceHistoryItem,
  AttendanceMonitorSummary,
  AttendanceMonitorSummaryFilters,
  AttendanceOvertimeSummary,
} from '../types/attendance.types';

export class AttendanceApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AttendanceApiError';
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

async function parseErrorMessage(body: string, fallback: string): Promise<string> {
  if (!body) return fallback;
  try {
    const parsed = JSON.parse(body) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join('. ');
    if (typeof parsed.message === 'string') return parsed.message;
  } catch {
    // Ignore parse errors and return plain text body
  }
  return body.length > 240 ? fallback : body;
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
    'Content-Type': 'application/json',
    'x-tenant-id': getTenantId(),
    ...(init?.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function attendanceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: buildHeaders(init),
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new AttendanceApiError('No autorizado', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const message = await parseErrorMessage(body, response.statusText);
    throw new AttendanceApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function registerAttendanceEntry(
  input: AttendanceEntryInput,
): Promise<AttendanceEntryResult> {
  return attendanceFetch<AttendanceEntryResult>('/attendance/entry', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function registerAttendanceExit(input: AttendanceExitInput): Promise<AttendanceExitResult> {
  return attendanceFetch<AttendanceExitResult>('/attendance/exit', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listAttendanceHistory(
  filters: AttendanceHistoryFilters = {},
): Promise<AttendanceHistoryItem[]> {
  const query = toQueryString({
    userId: filters.userId,
    locationId: filters.locationId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: filters.limit,
    offset: filters.offset,
  });
  return attendanceFetch<AttendanceHistoryItem[]>(`/attendance${query}`);
}

export function listAttendanceActive(locationId: string): Promise<AttendanceActiveEntry[]> {
  const query = toQueryString({ locationId });
  return attendanceFetch<AttendanceActiveEntry[]>(`/attendance/active${query}`);
}

async function getOvertimeSummaryV1(
  userId: string,
  date?: string,
): Promise<AttendanceOvertimeSummary> {
  const query = toQueryString({ date });
  return attendanceFetch<AttendanceOvertimeSummary>(`/attendance/${userId}/overtime${query}`);
}

async function getOvertimeSummaryV2(
  userId: string,
  date?: string,
): Promise<AttendanceOvertimeSummary> {
  const query = toQueryString({ date });
  return attendanceFetch<AttendanceOvertimeSummary>(
    `/attendance/employees/${userId}/overtime${query}`,
  );
}

export async function getAttendanceOvertimeSummary(
  userId: string,
  date?: string,
): Promise<AttendanceOvertimeSummary> {
  try {
    return await getOvertimeSummaryV1(userId, date);
  } catch (error) {
    if (error instanceof AttendanceApiError && error.status === 404) {
      return getOvertimeSummaryV2(userId, date);
    }
    throw error;
  }
}

export function getAttendanceMonitorSummary(
  locationId: string,
  filters: AttendanceMonitorSummaryFilters,
): Promise<AttendanceMonitorSummary> {
  const query = toQueryString({
    period: filters.period,
    anchorDate: filters.anchorDate,
  });
  return attendanceFetch<AttendanceMonitorSummary>(
    `/attendance/locations/${locationId}/monitor-summary${query}`,
  );
}

export function getAttendanceControlPanel(
  filters: AttendanceControlPanelFilters = {},
): Promise<AttendanceControlPanelSummary> {
  const query = toQueryString({
    anchorDate: filters.anchorDate,
    period: filters.period,
    locationId: filters.locationId,
    area: filters.area,
    contractType: filters.contractType,
    search: filters.search,
    page: filters.page,
    pageSize: filters.pageSize,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  });
  return attendanceFetch<AttendanceControlPanelSummary>(`/attendance/control-panel${query}`);
}

export function getAttendanceComparison(
  filters: AttendanceComparisonFilters = {},
): Promise<AttendanceComparisonSummary> {
  const query = toQueryString({
    anchorDate: filters.anchorDate,
    period: filters.period,
    locationId: filters.locationId,
    area: filters.area,
    contractType: filters.contractType,
    search: filters.search,
  });
  return attendanceFetch<AttendanceComparisonSummary>(
    `/attendance/control-panel/comparison${query}`,
  );
}
