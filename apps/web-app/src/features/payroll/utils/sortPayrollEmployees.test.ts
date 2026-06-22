import { toggleEmpleadoSort } from '@restopsiq/ui';
import { describe, expect, it } from 'vitest';

import type { PayrollEmployee } from '../types/payroll.types';
import { sortPayrollEmployees } from './sortPayrollEmployees';

function employee(
  overrides: Partial<PayrollEmployee> & Pick<PayrollEmployee, 'name'>,
): PayrollEmployee {
  return {
    id: overrides.id ?? 'emp-1',
    userId: overrides.userId ?? 'user-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    position: overrides.position ?? 'Cocinero',
    area: overrides.area ?? 'Cocina',
    department: 'Operaciones',
    contractType: 'FIJO',
    hireDate: overrides.hireDate ?? '2024-01-15',
    contractStart: '2024-01-15',
    salaryType: 'ORDINARIO',
    salaryAmount: '2000000',
    hasTransportSubsidy: false,
    isExemptFromTax: false,
    epsName: 'EPS',
    pensionFundName: 'Pension',
    cesantiasFundName: 'Cesantias',
    arlName: 'ARL',
    arlRiskLevel: 'RIESGO_I',
    cajaCompensacion: 'Caja',
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
    name: overrides.name,
  };
}

describe('sortPayrollEmployees', () => {
  const rows = [
    employee({
      id: '1',
      name: 'Zoe Vega',
      position: 'Chef',
      area: 'Cocina',
      hireDate: '2023-05-01',
    }),
    employee({
      id: '2',
      name: 'Ana Ruiz',
      position: 'Auxiliar',
      area: 'Planta',
      hireDate: '2025-02-10',
    }),
    employee({
      id: '3',
      name: 'Mario Lopez',
      position: 'Bodega',
      area: 'Logística',
      hireDate: '2024-11-20',
    }),
  ];

  it('ordena por nombre ascendente', () => {
    const sorted = sortPayrollEmployees(rows, 'employee', 'asc');
    expect(sorted.map((row) => row.name)).toEqual(['Ana Ruiz', 'Mario Lopez', 'Zoe Vega']);
  });

  it('ordena por ingreso descendente', () => {
    const sorted = sortPayrollEmployees(rows, 'hireDate', 'desc');
    expect(sorted.map((row) => row.hireDate)).toEqual(['2025-02-10', '2024-11-20', '2023-05-01']);
  });

  it('alterna dirección al repetir columna', () => {
    const first = toggleEmpleadoSort(null, 'asc', 'employee');
    expect(first).toEqual({ column: 'employee', direction: 'asc' });

    const second = toggleEmpleadoSort('employee', 'asc', 'employee');
    expect(second).toEqual({ column: 'employee', direction: 'desc' });
  });
});
