import { payrollFetch } from '../api/payroll.client';
import type {
  ColombiaDepartment,
  EmployeePersonalData,
  UpdateEmployeePersonalDataInput,
} from '../types/personal-data.types';

export function getEmployeePersonalData(userId: string): Promise<EmployeePersonalData> {
  return payrollFetch<EmployeePersonalData>(`/employees/${userId}/datos-personales`);
}

export function updateEmployeePersonalData(
  userId: string,
  input: UpdateEmployeePersonalDataInput,
): Promise<EmployeePersonalData> {
  return payrollFetch<EmployeePersonalData>(`/employees/${userId}/datos-personales`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function getColombiaDepartments(): Promise<ColombiaDepartment[]> {
  return payrollFetch<ColombiaDepartment[]>('/geo/departamentos');
}

export function getColombiaCities(departmentCode: string): Promise<string[]> {
  const params = new URLSearchParams({ departamento: departmentCode });
  return payrollFetch<string[]>(`/geo/ciudades?${params.toString()}`);
}
