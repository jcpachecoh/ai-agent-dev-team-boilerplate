import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import { AttendanceApiError } from '../api/attendance.client';
import { ATTENDANCE_CARD_OVERTIME_STATUSES } from '../mappers/attendance-card-overtime.mapper';
import type { OvertimeInboxResult } from '../types/overtime.types';

function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  return '';
}

/**
 * Lista overtime del colaborador para la Tarjeta.
 * Envía `status` repetido (no CSV) para que Nest lo parse como array y
 * MANAGER vea también SOLICITUD_ADMINISTRATIVA (no solo PENDIENTE_ADMIN).
 */
export async function fetchAttendanceCardOvertimeRequests(
  employeeId: string,
  payrollPeriod: string,
): Promise<OvertimeInboxResult> {
  const search = new URLSearchParams();
  search.set('employeeId', employeeId);
  search.set('payrollPeriod', payrollPeriod);
  search.set('take', '50');
  for (const status of ATTENDANCE_CARD_OVERTIME_STATUSES) {
    search.append('status', status);
  }

  const base = getApiBaseUrl();
  const query = search.toString();
  const url = base
    ? `${base}/api/attendance/overtime-requests?${query}`
    : `/api/attendance/overtime-requests?${query}`;

  const token = getGraphqlAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': getTenantId(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (response.status === 401) {
    window.location.href = '/login';
    throw new AttendanceApiError('No autorizado', 401);
  }
  if (!response.ok) {
    throw new AttendanceApiError(
      response.statusText || 'Error al cargar tiempo extra',
      response.status,
    );
  }
  return (await response.json()) as OvertimeInboxResult;
}

export function useAttendanceCardOvertimeQuery(
  employeeId: string,
  payrollPeriod: string,
  enabled = true,
): UseQueryResult<OvertimeInboxResult> {
  return useQuery({
    queryKey: ['attendance', 'card', 'overtime', employeeId, payrollPeriod] as const,
    queryFn: () => fetchAttendanceCardOvertimeRequests(employeeId, payrollPeriod),
    enabled: enabled && Boolean(employeeId) && Boolean(payrollPeriod),
  });
}
