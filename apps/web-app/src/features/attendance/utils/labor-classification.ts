import type { PayrollEmployee } from '@/features/payroll/types/payroll.types';

import type {
  AttendanceMonitorEmployee,
  AttendanceMonitorSummary,
} from '../types/attendance.types';

export type LaborClassification = 'ADMINISTRATIVO' | 'OPERACIONES';

export type LaborClassificationFilterValue = 'all' | 'administrativo' | 'operaciones';

const ADMIN_AREAS = new Set(['administración', 'administracion']);
const ADMIN_DEPARTMENTS = new Set(['gerencia', 'recursos humanos', 'contabilidad']);

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function getEmployeeLaborClassification(employee: PayrollEmployee): LaborClassification {
  const area = normalize(employee.area);
  const department = normalize(employee.department);

  if (ADMIN_AREAS.has(area) || ADMIN_DEPARTMENTS.has(department)) {
    return 'ADMINISTRATIVO';
  }

  return 'OPERACIONES';
}

export function matchesLaborClassificationFilter(
  employee: PayrollEmployee,
  filter: LaborClassificationFilterValue,
): boolean {
  if (filter === 'all') return true;
  const classification = getEmployeeLaborClassification(employee);
  return filter === 'administrativo'
    ? classification === 'ADMINISTRATIVO'
    : classification === 'OPERACIONES';
}

export function countByLaborClassification(
  employees: PayrollEmployee[],
): Record<LaborClassificationFilterValue, number> {
  let administrativo = 0;
  let operaciones = 0;

  for (const employee of employees) {
    if (getEmployeeLaborClassification(employee) === 'ADMINISTRATIVO') {
      administrativo += 1;
    } else {
      operaciones += 1;
    }
  }

  return {
    all: employees.length,
    administrativo,
    operaciones,
  };
}

export function buildLaborClassificationByUserId(
  employees: PayrollEmployee[],
): Map<string, LaborClassification> {
  const lookup = new Map<string, LaborClassification>();
  for (const employee of employees) {
    lookup.set(employee.userId, getEmployeeLaborClassification(employee));
  }
  return lookup;
}

export function matchesMonitorEmployeeLaborFilter(
  employee: Pick<AttendanceMonitorEmployee, 'userId'>,
  filter: LaborClassificationFilterValue,
  lookup: Map<string, LaborClassification>,
): boolean {
  if (filter === 'all') return true;

  const classification = lookup.get(employee.userId);
  if (!classification) return false;

  return filter === 'administrativo'
    ? classification === 'ADMINISTRATIVO'
    : classification === 'OPERACIONES';
}

function filterMonitorEmployees(
  employees: AttendanceMonitorEmployee[],
  filter: LaborClassificationFilterValue,
  lookup: Map<string, LaborClassification>,
): AttendanceMonitorEmployee[] {
  return employees.filter((employee) =>
    matchesMonitorEmployeeLaborFilter(employee, filter, lookup),
  );
}

export function filterAttendanceMonitorSummary(
  summary: AttendanceMonitorSummary,
  filter: LaborClassificationFilterValue,
  lookup: Map<string, LaborClassification>,
  payrollEmployees: PayrollEmployee[],
): AttendanceMonitorSummary {
  if (filter === 'all') return summary;

  const employees = {
    onShift: filterMonitorEmployees(summary.employees.onShift, filter, lookup),
    absent: filterMonitorEmployees(summary.employees.absent, filter, lookup),
    late: filterMonitorEmployees(summary.employees.late, filter, lookup),
    overtime: filterMonitorEmployees(summary.employees.overtime, filter, lookup),
  };

  const total = payrollEmployees.filter(
    (employee) =>
      employee.locationId === summary.locationId &&
      matchesLaborClassificationFilter(employee, filter),
  ).length;

  return {
    ...summary,
    metrics: {
      total,
      onShift: employees.onShift.length,
      absent: employees.absent.length,
      lateArrivals: employees.late.length,
      overtime: employees.overtime.length,
      offSchedule: employees.late.length,
      legalAlerts: summary.metrics.legalAlerts,
    },
    employees,
  };
}
