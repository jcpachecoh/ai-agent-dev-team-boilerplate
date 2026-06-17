import type { PayrollEmployeesFilters } from '../types/payroll.types';
import type { AttendanceReportQuery, PayrollReportQuery } from '../types/payroll-reports.types';

export const payrollKeys = {
  all: ['payroll'] as const,
  employees: () => [...payrollKeys.all, 'employees'] as const,
  employeeList: (filters: PayrollEmployeesFilters) =>
    [...payrollKeys.employees(), filters] as const,
  employee: (userId: string) => [...payrollKeys.employees(), 'detail', userId] as const,
  reports: () => [...payrollKeys.all, 'reports'] as const,
  payrollReport: (query: PayrollReportQuery) =>
    [...payrollKeys.reports(), 'payroll', query] as const,
  attendanceReport: (query: AttendanceReportQuery) =>
    [...payrollKeys.reports(), 'attendance', query] as const,
};
