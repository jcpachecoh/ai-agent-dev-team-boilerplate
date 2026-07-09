import type { PayrollEmployeesFilters } from '../types/payroll.types';
import type { AttendanceReportQuery, PayrollReportQuery } from '../types/payroll-reports.types';
import type { ListEmployeePositionsFilters } from '../types/employee-position.types';
import type { ListMedicalLeavesFilters } from '../types/medical-leaves.types';

export const payrollKeys = {
  all: ['payroll'] as const,
  employees: () => [...payrollKeys.all, 'employees'] as const,
  employeeList: (filters: PayrollEmployeesFilters) =>
    [...payrollKeys.employees(), filters] as const,
  employee: (userId: string) => [...payrollKeys.employees(), 'detail', userId] as const,
  employeeMarcaciones: (
    employeeId: string,
    filters: { dateFrom: string; dateTo: string; status?: string | null; take?: number },
  ) => [...payrollKeys.all, 'marcaciones', employeeId, filters] as const,
  bankAccounts: (employeeId: string) => [...payrollKeys.all, 'bank-accounts', employeeId] as const,
  taxInformation: (employeeId: string) =>
    [...payrollKeys.all, 'tax-information', employeeId] as const,
  paymentHistory: (employeeId: string) =>
    [...payrollKeys.all, 'payment-history', employeeId] as const,
  catalogs: () => [...payrollKeys.all, 'employee-catalogs'] as const,
  catalogList: (type?: string) => [...payrollKeys.catalogs(), type ?? 'all'] as const,
  positions: () => [...payrollKeys.all, 'employee-positions'] as const,
  positionList: (filters: ListEmployeePositionsFilters = {}) =>
    [...payrollKeys.positions(), filters] as const,
  assets: (employeeId: string) => [...payrollKeys.all, 'employee-assets', employeeId] as const,
  documents: (employeeId: string) =>
    [...payrollKeys.all, 'employee-documents', employeeId] as const,
  dotaciones: () => [...payrollKeys.all, 'dotaciones'] as const,
  dotacionPeriod: (period: string, locationId?: string) =>
    [...payrollKeys.dotaciones(), 'period', period, locationId ?? 'all'] as const,
  dotacionAvailableItems: () => [...payrollKeys.dotaciones(), 'available-items'] as const,
  dotacionEmployeeHistory: (employeeId: string) =>
    [...payrollKeys.dotaciones(), 'history', employeeId] as const,
  reports: () => [...payrollKeys.all, 'reports'] as const,
  payrollReport: (query: PayrollReportQuery) =>
    [...payrollKeys.reports(), 'payroll', query] as const,
  attendanceReport: (query: AttendanceReportQuery) =>
    [...payrollKeys.reports(), 'attendance', query] as const,
  medicalLeaves: () => [...payrollKeys.all, 'medical-leaves'] as const,
  medicalLeaveList: (filters: ListMedicalLeavesFilters = {}) =>
    [...payrollKeys.medicalLeaves(), filters] as const,
  medicalLeaveDetail: (id: string) => [...payrollKeys.medicalLeaves(), 'detail', id] as const,
  vacations: () => [...payrollKeys.all, 'vacations'] as const,
  vacationBalance: (employeeId: string) =>
    [...payrollKeys.vacations(), 'balance', employeeId] as const,
  vacationRequests: (filters: Record<string, unknown> = {}) =>
    [...payrollKeys.vacations(), 'requests', filters] as const,
};
