import type { ListCesantiasFilters } from '../types/cesantias.types';
import type { ListEmployeePositionsFilters } from '../types/employee-position.types';
import type { ListMedicalLeavesFilters } from '../types/medical-leaves.types';
import type {
  ListMyPayrollNovedadesFilters,
  ListPayrollNovedadesFilters,
} from '../types/payroll-novedades.types';
import type { AttendanceReportQuery, PayrollReportQuery } from '../types/payroll-reports.types';
import type { PayrollEmployeesFilters } from '../types/payroll.types';

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
  payrollNovedades: () => [...payrollKeys.all, 'payroll-novedades'] as const,
  payrollNovedadList: (filters: ListPayrollNovedadesFilters = {}) =>
    [...payrollKeys.payrollNovedades(), filters] as const,
  payrollNovedadDetail: (id: string) => [...payrollKeys.payrollNovedades(), 'detail', id] as const,
  payrollNovedadAudit: (id: string) => [...payrollKeys.payrollNovedades(), 'audit', id] as const,
  novedadTypeConfig: () => [...payrollKeys.payrollNovedades(), 'type-config'] as const,
  myPayrollNovedades: (filters: ListMyPayrollNovedadesFilters = {}) =>
    [...payrollKeys.payrollNovedades(), 'me', filters] as const,
  employeeNovedadTypeConfig: () =>
    [...payrollKeys.payrollNovedades(), 'me', 'type-config'] as const,
  cesantias: () => [...payrollKeys.all, 'cesantias'] as const,
  cesantiasList: (filters: ListCesantiasFilters = {}) =>
    [...payrollKeys.cesantias(), filters] as const,
  cesantiasAlertSummary: () => [...payrollKeys.cesantias(), 'alert-summary'] as const,
  cesantiasExportAvailability: (year: number) =>
    [...payrollKeys.cesantias(), 'export-availability', year] as const,
  dailyCostCenter: () => [...payrollKeys.all, 'daily-cost-center'] as const,
  dailyCostCenterCalendar: (employeeId: string, from: string, to: string) =>
    [...payrollKeys.dailyCostCenter(), 'calendar', employeeId, from, to] as const,
  dailyCostCenterPending: (from: string, to: string) =>
    [...payrollKeys.dailyCostCenter(), 'pending', from, to] as const,
  finalSettlements: () => [...payrollKeys.all, 'final-settlements'] as const,
  finalSettlementsByEmployee: (employeeDetailsId: string) =>
    [...payrollKeys.finalSettlements(), 'employee', employeeDetailsId] as const,
  finalSettlementDetail: (id: string) => [...payrollKeys.finalSettlements(), 'detail', id] as const,
  pendingSalaryReconciliation: (settlementId: string) =>
    [...payrollKeys.finalSettlements(), 'reconciliation', settlementId] as const,
  legalFormulaValidations: () => [...payrollKeys.all, 'legal-formula-validations'] as const,
  legalFormulaValidationActive: (formulaVersion: number) =>
    [...payrollKeys.legalFormulaValidations(), 'active', formulaVersion] as const,
  pila: () => [...payrollKeys.all, 'pila'] as const,
  pilaList: (period: string) => [...payrollKeys.pila(), 'list', period] as const,
  pilaValidation: (period: string) => [...payrollKeys.pila(), 'validation', period] as const,
  pilaDeadline: (period: string) => [...payrollKeys.pila(), 'deadline', period] as const,
};
