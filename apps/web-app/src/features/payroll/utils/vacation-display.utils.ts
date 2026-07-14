import type { EmployeeContractType } from '@/features/payroll/types/payroll.types';
import type { VacationStatus } from '@/features/payroll/types/vacations.types';

const BOGOTA_TZ = 'America/Bogota';

export const VACATION_MIN_ADVANCE_DAYS = 15;

function parseDateOnly(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatDateParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getBogotaTodayDateString(referenceDate: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(referenceDate);
}

export function addCalendarDays(dateOnly: string, days: number): string {
  const { year, month, day } = parseDateOnly(dateOnly);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return formatDateParts(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate());
}

export function getMinVacationStartDateString(referenceDate: Date = new Date()): string {
  return addCalendarDays(getBogotaTodayDateString(referenceDate), VACATION_MIN_ADVANCE_DAYS);
}

export function calculateInclusiveCalendarDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
}

export function calculateBusinessDaysInRange(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
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
