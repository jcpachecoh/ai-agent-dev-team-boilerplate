import { payrollFetch } from './payroll.client';
import type {
  CreateVacationRequestInput,
  VacationBalance,
  VacationRequest,
  VacationRequestSummary,
  VacationRequestsFilters,
} from '../types/vacations.types';

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export function getVacationBalance(employeeId: string): Promise<VacationBalance> {
  return payrollFetch<VacationBalance>(`/vacations/balance/${employeeId}`);
}

export function getMyVacationBalance(): Promise<VacationBalance> {
  return payrollFetch<VacationBalance>('/vacations/me/balance');
}

export function listVacationRequests(
  filters: VacationRequestsFilters = {},
): Promise<VacationRequestSummary[]> {
  const params = toQueryString({
    employeeId: filters.employeeId,
    locationId: filters.locationId,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    cursor: filters.cursor,
    take: filters.take,
  });
  return payrollFetch<VacationRequestSummary[]>(`/vacations/requests${params}`);
}

export function listMyVacationRequests(
  filters: Omit<VacationRequestsFilters, 'employeeId'> = {},
): Promise<VacationRequestSummary[]> {
  const params = toQueryString({
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    cursor: filters.cursor,
    take: filters.take,
  });
  return payrollFetch<VacationRequestSummary[]>(`/vacations/me/requests${params}`);
}

export function createVacationRequest(input: CreateVacationRequestInput): Promise<VacationRequest> {
  return payrollFetch<VacationRequest>('/vacations/requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function approveVacationLevel1(requestId: string): Promise<VacationRequest> {
  return payrollFetch<VacationRequest>(`/vacations/requests/${requestId}/approve-level-1`, {
    method: 'POST',
  });
}

export function approveVacationLevel2(requestId: string): Promise<VacationRequest> {
  return payrollFetch<VacationRequest>(`/vacations/requests/${requestId}/approve-level-2`, {
    method: 'POST',
  });
}

export function rejectVacation(
  requestId: string,
  rejectionReason: string,
): Promise<VacationRequest> {
  return payrollFetch<VacationRequest>(`/vacations/requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason }),
  });
}

export function getVacationLetterUrl(requestId: string): Promise<{ url: string }> {
  return payrollFetch<{ url: string }>(`/vacations/requests/${requestId}/letter`);
}
