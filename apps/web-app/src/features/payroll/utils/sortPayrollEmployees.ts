import type { EmpleadoSortColumnKey, EmpleadoSortDirection } from '@restopsiq/ui';

import type { PayrollEmployee } from '../types/payroll.types';

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

export function sortPayrollEmployees(
  employees: PayrollEmployee[],
  column: EmpleadoSortColumnKey | null,
  direction: EmpleadoSortDirection,
): PayrollEmployee[] {
  if (!column) {
    return employees;
  }

  const sorted = [...employees];

  sorted.sort((left, right) => {
    let result = 0;

    if (column === 'employee') {
      result = compareStrings(left.name, right.name);
    } else if (column === 'role') {
      const leftRole = `${left.position} ${left.area}`.trim();
      const rightRole = `${right.position} ${right.area}`.trim();
      result = compareStrings(leftRole, rightRole);
    } else if (column === 'hireDate') {
      result = compareStrings(left.hireDate ?? '', right.hireDate ?? '');
    }

    return direction === 'asc' ? result : -result;
  });

  return sorted;
}
