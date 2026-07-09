import type { EmployeeContractType } from '@/features/payroll/types/payroll.types';
import type { VacationStatus } from '@/features/payroll/types/vacations.types';

export function calculateInclusiveCalendarDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
}

export function formatVacationDate(value: string): string {
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Etiqueta corta para chips del calendario (celdas angostas). */
export function formatCalendarEmployeeLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Empleado';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!;

  const firstName = parts[0]!;
  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

export function canApproveVacationLevel1(roleCode: string | null | undefined): boolean {
  return ['SUPERVISOR', 'MANAGER', 'OWNER', 'SUPER_ADMIN', 'NOMINA'].includes(roleCode ?? '');
}

export function canApproveVacationLevel2(roleCode: string | null | undefined): boolean {
  return ['NOMINA', 'OWNER', 'SUPER_ADMIN'].includes(roleCode ?? '');
}

export function canRejectVacation(
  status: VacationStatus,
  roleCode: string | null | undefined,
): boolean {
  if (status === 'SOLICITADA') {
    return canApproveVacationLevel1(roleCode);
  }
  if (status === 'APROBADA_NIVEL_1') {
    return canApproveVacationLevel2(roleCode) || canApproveVacationLevel1(roleCode);
  }
  return false;
}

export function canDownloadVacationLetter(status: VacationStatus): boolean {
  return status === 'APROBADA' || status === 'RECHAZADA';
}

export function canRequestVacations(contractType: EmployeeContractType | undefined): boolean {
  return contractType !== 'PRESTACION';
}

export function currentVacationMonth(): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${now.getUTCFullYear()}-${month}`;
}

export function monthToIsoDateRange(month: string): { dateFrom?: string; dateTo?: string } {
  const value = month.trim();
  if (!value) {
    return {};
  }

  const [year, monthNumber] = value.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year!, monthNumber!, 0)).getUTCDate();

  return {
    dateFrom: `${value}-01`,
    dateTo: `${value}-${String(lastDay).padStart(2, '0')}`,
  };
}
