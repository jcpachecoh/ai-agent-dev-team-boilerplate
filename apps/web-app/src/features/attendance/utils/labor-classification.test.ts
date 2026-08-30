import { describe, expect, it } from 'vitest';

import type { PayrollEmployee } from '@/features/payroll/types/payroll.types';

import {
  countByLaborClassification,
  filterAttendanceMonitorSummary,
  getEmployeeLaborClassification,
  matchesLaborClassificationFilter,
} from './labor-classification';
import type { AttendanceMonitorSummary } from '../types/attendance.types';

function buildEmployee(overrides: Partial<PayrollEmployee> = {}): PayrollEmployee {
  return {
    id: 'emp-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    name: 'Ana López',
    locationId: 'loc-1',
    position: 'Analista',
    area: 'Operaciones',
    department: 'Producción',
    contractType: 'INDEFINIDO',
    hireDate: '2024-01-01',
    contractStart: '2024-01-01',
    salaryType: 'ORDINARIO',
    salaryAmount: '2000000',
    hasTransportSubsidy: false,
    isExemptFromTax: false,
    epsName: 'EPS',
    pensionFundName: 'Pension',
    cesantiasFundName: 'Cesantías',
    arlName: 'ARL',
    arlRiskLevel: 'RIESGO_I',
    cajaCompensacion: 'Caja',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('labor-classification', () => {
  it('classifies administrative collaborators by area or department', () => {
    expect(getEmployeeLaborClassification(buildEmployee({ area: 'Administración' }))).toBe(
      'ADMINISTRATIVO',
    );
    expect(
      getEmployeeLaborClassification(
        buildEmployee({ area: 'Operaciones', department: 'Contabilidad' }),
      ),
    ).toBe('ADMINISTRATIVO');
  });

  it('classifies operational collaborators by default', () => {
    expect(getEmployeeLaborClassification(buildEmployee())).toBe('OPERACIONES');
  });

  it('filters collaborators by labor classification', () => {
    const employees = [
      buildEmployee({ id: '1', area: 'Administración' }),
      buildEmployee({ id: '2', area: 'Cocina' }),
    ];

    expect(matchesLaborClassificationFilter(employees[0]!, 'administrativo')).toBe(true);
    expect(matchesLaborClassificationFilter(employees[1]!, 'administrativo')).toBe(false);
    expect(countByLaborClassification(employees)).toEqual({
      all: 2,
      administrativo: 1,
      operaciones: 1,
    });
  });

  it('filters monitor summary by labor classification', () => {
    const payrollEmployees = [
      buildEmployee({ id: 'emp-admin', userId: 'user-admin', area: 'Administración' }),
      buildEmployee({ id: 'emp-ops', userId: 'user-ops', area: 'Cocina' }),
    ];
    const lookup = new Map([
      ['user-admin', 'ADMINISTRATIVO'],
      ['user-ops', 'OPERACIONES'],
    ] as const);

    const summary: AttendanceMonitorSummary = {
      locationId: 'loc-1',
      period: 'day',
      anchorDate: '2026-06-30',
      dateFrom: '2026-06-30',
      dateTo: '2026-06-30',
      isLive: true,
      metrics: {
        total: 2,
        onShift: 0,
        absent: 2,
        lateArrivals: 0,
        overtime: 0,
        offSchedule: 0,
        legalAlerts: 0,
      },
      employees: {
        onShift: [],
        absent: [
          {
            employeeId: 'emp-admin',
            userId: 'user-admin',
            name: 'Admin',
            role: 'Analista',
            status: 'absent',
          },
          {
            employeeId: 'emp-ops',
            userId: 'user-ops',
            name: 'Operario',
            role: 'Cocina',
            status: 'absent',
          },
        ],
        late: [],
        overtime: [],
      },
    };

    const filtered = filterAttendanceMonitorSummary(
      summary,
      'administrativo',
      lookup,
      payrollEmployees,
    );

    expect(filtered.metrics.total).toBe(1);
    expect(filtered.metrics.absent).toBe(1);
    expect(filtered.employees.absent).toHaveLength(1);
    expect(filtered.employees.absent[0]?.userId).toBe('user-admin');
  });
});
