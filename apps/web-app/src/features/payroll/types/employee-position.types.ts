export interface EmployeePositionSupervisorSummary {
  id: string;
  title: string;
}

export interface EmployeePosition {
  id: string;
  tenantId?: string;
  title: string;
  area: string;
  baseSalaryRange: number;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
  /** OS-633 — cargos supervisores directos (fuente de verdad: EmployeePositionSupervisor). */
  supervisors: EmployeePositionSupervisorSummary[];
}

export interface ListEmployeePositionsFilters {
  includeInactive?: boolean;
  area?: string;
  search?: string;
}

export interface CreateEmployeePositionInput {
  title: string;
  area: string;
  baseSalaryRange: number;
  supervisorPositionIds?: string[];
}

export type UpdateEmployeePositionInput = Partial<CreateEmployeePositionInput> & {
  isActive?: boolean;
};

export interface EmployeePositionFormValues {
  title: string;
  area: string;
  baseSalaryRange: string;
  isActive: boolean;
  supervisorPositionIds: string[];
}

export function employeePositionToFormValues(
  position: EmployeePosition,
): EmployeePositionFormValues {
  const salary =
    typeof position.baseSalaryRange === 'number'
      ? String(position.baseSalaryRange)
      : position.baseSalaryRange;

  return {
    title: position.title,
    area: position.area,
    baseSalaryRange: salary,
    isActive: position.isActive,
    supervisorPositionIds: position.supervisors.map((supervisor) => supervisor.id),
  };
}

export function parseEmployeePositionSalary(value: string): number {
  const normalized = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  return Number(normalized);
}

export function formatCopCurrency(value: number | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numeric);
}
