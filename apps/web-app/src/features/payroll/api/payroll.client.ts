import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import type {
  AttendanceReportQuery,
  AttendanceReportResponse,
  PayrollReportExportFormat,
  PayrollReportQuery,
  PayrollReportResponse,
} from '../types/payroll-reports.types';
import type {
  CreatePayrollEmployeeInput,
  PayrollEmployee,
  PayrollEmployeesFilters,
  UpdatePayrollEmployeeInput,
} from '../types/payroll.types';
import type { EmployeeCatalogOption, EmployeeCatalogType } from '../types/employee-catalog.types';

export class PayrollApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'PayrollApiError';
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

function getPayrollBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  return '';
}

function buildPayrollUrl(path: string): string {
  const base = getPayrollBaseUrl();
  return base ? `${base}/api${path}` : `/api${path}`;
}

function buildPayrollHeaders(init?: RequestInit): HeadersInit {
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

export async function payrollFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildPayrollUrl(path), {
    ...init,
    headers: buildPayrollHeaders(init),
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new PayrollApiError('No autorizado', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const message = await parseErrorMessage(body, response.statusText);
    throw new PayrollApiError(message, response.status);
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

async function payrollFetchBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(buildPayrollUrl(path), {
    ...init,
    headers: buildPayrollHeaders(init),
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new PayrollApiError('No autorizado', 401);
  }

  if (!response.ok) {
    const body = await response.text();
    const message = await parseErrorMessage(body, response.statusText);
    throw new PayrollApiError(message, response.status);
  }

  return response.blob();
}

export function getPayrollReport(query: PayrollReportQuery): Promise<PayrollReportResponse> {
  const params = toQueryString({
    period: query.period,
    locationId: query.locationId,
  });
  return payrollFetch<PayrollReportResponse>(`/reports/payroll${params}`);
}

export function getAttendanceReport(
  query: AttendanceReportQuery,
): Promise<AttendanceReportResponse> {
  const params = toQueryString({
    from: query.from,
    to: query.to,
    locationId: query.locationId,
  });
  return payrollFetch<AttendanceReportResponse>(`/reports/attendance${params}`);
}

export function exportPayrollReport(
  period: string,
  format: PayrollReportExportFormat,
): Promise<Blob> {
  return payrollFetchBlob('/reports/payroll/export', {
    method: 'POST',
    body: JSON.stringify({ period, format }),
  });
}

export function listPayrollEmployees(
  filters: PayrollEmployeesFilters = {},
): Promise<PayrollEmployee[]> {
  const query = toQueryString({
    locationId: filters.locationId,
    contractType: filters.contractType,
    includeInactive: filters.includeInactive,
    limit: filters.limit,
    offset: filters.offset,
  });
  return payrollFetch<PayrollEmployee[]>(`/employees${query}`);
}

const PAYROLL_EMPLOYEES_MAX_PAGE_SIZE = 100;

export async function listAllPayrollEmployees(
  filters: Omit<PayrollEmployeesFilters, 'limit' | 'offset'> = {},
): Promise<PayrollEmployee[]> {
  const employees: PayrollEmployee[] = [];
  let offset = 0;

  while (true) {
    const page = await listPayrollEmployees({
      ...filters,
      limit: PAYROLL_EMPLOYEES_MAX_PAGE_SIZE,
      offset,
    });
    employees.push(...page);

    if (page.length < PAYROLL_EMPLOYEES_MAX_PAGE_SIZE) {
      return employees;
    }

    offset += PAYROLL_EMPLOYEES_MAX_PAGE_SIZE;
  }
}

export function getPayrollEmployeeByUserId(userId: string): Promise<PayrollEmployee> {
  return payrollFetch<PayrollEmployee>(`/employees/${userId}`);
}

export function createPayrollEmployee(input: CreatePayrollEmployeeInput): Promise<PayrollEmployee> {
  return payrollFetch<PayrollEmployee>('/employees', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePayrollEmployee(
  userId: string,
  input: UpdatePayrollEmployeeInput,
): Promise<PayrollEmployee> {
  return payrollFetch<PayrollEmployee>(`/employees/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function removePayrollEmployee(userId: string): Promise<boolean> {
  return payrollFetch<boolean>(`/employees/${userId}`, {
    method: 'DELETE',
  });
}

export function listEmployeeCatalogOptions(
  type?: EmployeeCatalogType,
): Promise<EmployeeCatalogOption[]> {
  const query = toQueryString({ type });
  return payrollFetch<EmployeeCatalogOption[]>(`/employee-catalogs${query}`);
}
