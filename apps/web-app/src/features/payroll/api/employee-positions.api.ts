import { payrollFetch } from './payroll.client';
import type {
  CreateEmployeePositionInput,
  EmployeePosition,
  ListEmployeePositionsFilters,
  UpdateEmployeePositionInput,
} from '../types/employee-position.types';

function normalizeEmployeePosition(position: EmployeePosition): EmployeePosition {
  return {
    ...position,
    baseSalaryRange: Number(position.baseSalaryRange),
  };
}

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

export function listEmployeePositions(
  filters: ListEmployeePositionsFilters = {},
): Promise<EmployeePosition[]> {
  const query = toQueryString({
    includeInactive: filters.includeInactive,
    area: filters.area,
    search: filters.search,
  });
  return payrollFetch<EmployeePosition[]>(`/employee-positions${query}`).then((items) =>
    items.map(normalizeEmployeePosition),
  );
}

export function getEmployeePosition(id: string): Promise<EmployeePosition> {
  return payrollFetch<EmployeePosition>(`/employee-positions/${id}`).then(
    normalizeEmployeePosition,
  );
}

export function createEmployeePosition(
  input: CreateEmployeePositionInput,
): Promise<EmployeePosition> {
  return payrollFetch<EmployeePosition>('/employee-positions', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then(normalizeEmployeePosition);
}

export function updateEmployeePosition(
  id: string,
  input: UpdateEmployeePositionInput,
): Promise<EmployeePosition> {
  return payrollFetch<EmployeePosition>(`/employee-positions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }).then(normalizeEmployeePosition);
}

export function deactivateEmployeePosition(id: string): Promise<EmployeePosition> {
  return payrollFetch<EmployeePosition>(`/employee-positions/${id}/deactivate`, {
    method: 'PATCH',
  }).then(normalizeEmployeePosition);
}
