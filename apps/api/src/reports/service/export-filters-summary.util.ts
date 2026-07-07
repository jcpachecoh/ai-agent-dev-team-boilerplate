import type { EmployeeListExportQueryDto } from '../controller/dto/employee-list-export-query.dto';
import {
  AttendanceReportStatusFilter,
  type AttendanceExportQueryDto,
} from '../controller/dto/attendance-export-query.dto';
import type { PeriodQueryDto } from '../controller/dto/report-query.dto';

export function buildEmployeeListFiltersSummary(
  query: Omit<EmployeeListExportQueryDto, 'format'>,
): string[] {
  const summary: string[] = [];
  if (query.locationId) summary.push(`Sede: ${query.locationId}`);
  if (query.employeeId) summary.push(`Empleado: ${query.employeeId}`);
  if (query.positionId) summary.push(`Cargo: ${query.positionId}`);
  if (query.area) summary.push(`Área: ${query.area}`);
  if (query.department) summary.push(`Departamento: ${query.department}`);
  if (query.contractType) summary.push(`Contrato: ${query.contractType}`);
  if (query.isActive === true) summary.push('Estado: Activos');
  if (query.isActive === false) summary.push('Estado: Inactivos');
  if (query.search) summary.push(`Búsqueda: ${query.search}`);
  if (summary.length === 0) summary.push('Sin filtros adicionales');
  return summary;
}

export function buildPayrollFiltersSummary(query: PeriodQueryDto): string[] {
  const summary: string[] = [`Periodo: ${query.period}`];
  if (query.locationId) summary.push(`Sede: ${query.locationId}`);
  if (query.employeeId) summary.push(`Empleado: ${query.employeeId}`);
  if (query.contractType) summary.push(`Contrato: ${query.contractType}`);
  return summary;
}

export function buildAttendanceFiltersSummary(
  query: Omit<AttendanceExportQueryDto, 'format'>,
): string[] {
  const summary: string[] = [`Desde: ${query.from}`, `Hasta: ${query.to}`];
  if (query.locationId) summary.push(`Sede: ${query.locationId}`);
  if (query.employeeId) summary.push(`Empleado: ${query.employeeId}`);
  if (query.status && query.status !== AttendanceReportStatusFilter.ALL) {
    summary.push(`Estado: ${query.status}`);
  }
  return summary;
}
