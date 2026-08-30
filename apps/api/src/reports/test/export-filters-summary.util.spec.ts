import { EmployeeContractType } from '@prisma/client';
import { AttendanceReportStatusFilter } from '../controller/dto/attendance-export-query.dto';
import {
  buildAttendanceFiltersSummary,
  buildEmployeeListFiltersSummary,
  buildPayrollFiltersSummary,
} from '../service/export-filters-summary.util';

describe('export-filters-summary.util', () => {
  it('builds employee list summary with active filter', () => {
    expect(
      buildEmployeeListFiltersSummary({
        locationId: 'loc-1',
        isActive: true,
        search: 'ana',
      }),
    ).toEqual(['Sede: loc-1', 'Estado: Activos', 'Búsqueda: ana']);
  });

  it('builds employee list summary with inactive and optional fields', () => {
    expect(
      buildEmployeeListFiltersSummary({
        employeeId: 'emp-1',
        positionId: 'pos-1',
        area: 'Cocina',
        department: 'Ops',
        contractType: EmployeeContractType.FIJO,
        isActive: false,
      }),
    ).toEqual([
      'Empleado: emp-1',
      'Cargo: pos-1',
      'Área: Cocina',
      'Departamento: Ops',
      'Contrato: FIJO',
      'Estado: Inactivos',
    ]);
  });

  it('builds employee list summary without filters', () => {
    expect(buildEmployeeListFiltersSummary({})).toEqual(['Sin filtros adicionales']);
  });

  it('builds payroll summary with period and sede', () => {
    expect(buildPayrollFiltersSummary({ period: '2025-06', locationId: 'loc-1' })).toEqual([
      'Periodo: 2025-06',
      'Sede: loc-1',
    ]);
  });

  it('builds payroll summary with employee and contract filters', () => {
    expect(
      buildPayrollFiltersSummary({
        period: '2025-06',
        employeeId: 'emp-1',
        contractType: EmployeeContractType.INDEFINIDO,
      }),
    ).toEqual(['Periodo: 2025-06', 'Empleado: emp-1', 'Contrato: INDEFINIDO']);
  });

  it('builds attendance summary with date range', () => {
    expect(
      buildAttendanceFiltersSummary({
        from: '2025-06-01',
        to: '2025-06-30',
      }),
    ).toEqual(['Desde: 2025-06-01', 'Hasta: 2025-06-30']);
  });

  it('builds attendance summary with optional filters', () => {
    expect(
      buildAttendanceFiltersSummary({
        from: '2025-06-01',
        to: '2025-06-30',
        locationId: 'loc-1',
        employeeId: 'emp-1',
        status: AttendanceReportStatusFilter.PRESENT,
      }),
    ).toEqual([
      'Desde: 2025-06-01',
      'Hasta: 2025-06-30',
      'Sede: loc-1',
      'Empleado: emp-1',
      'Estado: PRESENT',
    ]);
  });

  it('omits ALL status from attendance summary', () => {
    expect(
      buildAttendanceFiltersSummary({
        from: '2025-06-01',
        to: '2025-06-30',
        status: AttendanceReportStatusFilter.ALL,
      }),
    ).toEqual(['Desde: 2025-06-01', 'Hasta: 2025-06-30']);
  });
});
