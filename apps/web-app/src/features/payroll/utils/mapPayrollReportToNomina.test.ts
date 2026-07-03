import { describe, expect, it } from 'vitest';

import type {
  AttendanceReportResponse,
  PayrollReportResponse,
} from '../types/payroll-reports.types';
import {
  formatOvertimeMinutes,
  mapLegalAlertItems,
  mapPayrollChartData,
  mapPayrollKpiMetrics,
} from './mapPayrollReportToNomina';

const payrollReport: PayrollReportResponse = {
  tenantId: 'tenant-1',
  period: { year: 2025, month: 6 },
  tenantTotals: {
    employeeCount: 2,
    totalGrossPay: 5000000,
    totalDeductions: 400000,
    totalNetPay: 4600000,
    totalEmployerContributions: 900000,
    totalPayrollCost: 5500000,
  },
  locationTotals: [
    {
      locationId: 'loc-1',
      locationName: 'Chapinero - Bogotá',
      employeeCount: 1,
      totalNetPay: 2300000,
      totalEmployerContributions: 450000,
      totalPayrollCost: 2750000,
    },
    {
      locationId: 'loc-2',
      locationName: 'El Poblado - Medellín',
      employeeCount: 1,
      totalNetPay: 2300000,
      totalEmployerContributions: 450000,
      totalPayrollCost: 2750000,
    },
  ],
};

const attendanceReport: AttendanceReportResponse = {
  tenantId: 'tenant-1',
  from: '2025-06-01',
  to: '2025-06-30',
  employees: [
    {
      employeeId: 'emp-1',
      employeeName: 'Ana López',
      locationId: 'loc-1',
      locationName: 'Chapinero - Bogotá',
      totalWorkedMinutes: 6000,
      overtimeMinutes: 180,
      exceededLegalOvertimeLimit: true,
    },
    {
      employeeId: 'emp-2',
      employeeName: 'Carlos Ruiz',
      locationId: 'loc-2',
      locationName: 'El Poblado - Medellín',
      totalWorkedMinutes: 4800,
      overtimeMinutes: 60,
      exceededLegalOvertimeLimit: false,
    },
  ],
};

describe('mapPayrollKpiMetrics', () => {
  it('expone nómina, horas extras y alertas legales', () => {
    const metrics = mapPayrollKpiMetrics(payrollReport, attendanceReport);

    expect(metrics).toHaveLength(3);
    expect(metrics[0]?.id).toBe('payroll');
    expect(metrics[1]?.id).toBe('overtime');
    expect(metrics[1]?.value).toBe(formatOvertimeMinutes(240));
    expect(metrics[2]?.id).toBe('alerts');
    expect(metrics[2]?.value).toBe('1');
  });
});

describe('mapPayrollChartData', () => {
  it('muestra horas trabajadas por sede en modo mes', () => {
    const chart = mapPayrollChartData(payrollReport, 'month', attendanceReport);

    expect(chart.title).toBe('Asistencia por sede (mes)');
    expect(chart.valueType).toBe('number');
    expect(chart.data[0]?.['loc-1']).toBe(100);
    expect(chart.data[0]?.['loc-2']).toBe(80);
  });

  it('muestra horas trabajadas por sede en modo semana', () => {
    const chart = mapPayrollChartData(payrollReport, 'week', attendanceReport);

    expect(chart.title).toBe('Asistencia por sede (semana)');
    expect(chart.data[0]?.['loc-1']).toBe(100);
  });
});

describe('mapLegalAlertItems', () => {
  it('lista empleados que exceden el límite legal', () => {
    const items = mapLegalAlertItems(attendanceReport);

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Ana López');
    expect(items[0]?.subtitle).toContain('Chapinero');
    expect(items[0]?.subtitle).toContain('3h extras');
  });
});
