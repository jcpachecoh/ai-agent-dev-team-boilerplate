import { listPayrollEmployees } from '@/features/payroll/api/payroll.client';
import type { PayrollEmployee } from '@/features/payroll/types/payroll.types';

import type { DocumentType } from '../types';

let employeesCache: PayrollEmployee[] | null = null;
let employeesCachePromise: Promise<PayrollEmployee[]> | null = null;

function normalizeCedula(value: string): string {
  return value.replace(/[.\s]/g, '').trim();
}

function normalizeDocumentType(value: string | undefined): DocumentType | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === 'PASSPORT') return 'PASAPORTE';
  return upper as DocumentType;
}

async function loadEmployeesForLookup(): Promise<PayrollEmployee[]> {
  if (employeesCache) {
    return employeesCache;
  }

  if (!employeesCachePromise) {
    employeesCachePromise = listPayrollEmployees({ includeInactive: true })
      .then((employees) => {
        employeesCache = employees;
        return employees;
      })
      .finally(() => {
        employeesCachePromise = null;
      });
  }

  return employeesCachePromise;
}

export function resetEmployeeDocumentLookupCache(): void {
  employeesCache = null;
  employeesCachePromise = null;
}

export async function findEmployeeNameByDocument(
  cedula: string,
  documentType: DocumentType,
): Promise<string | null> {
  const normalizedCedula = normalizeCedula(cedula);
  if (!normalizedCedula) {
    return null;
  }

  const employees = await loadEmployeesForLookup();
  const match = employees.find((employee) => {
    const employeeCedula = normalizeCedula(employee.user?.cedula ?? '');
    const employeeDocumentType = normalizeDocumentType(employee.user?.documentType);
    return employeeCedula === normalizedCedula && employeeDocumentType === documentType;
  });

  return match?.name?.trim() ?? null;
}
