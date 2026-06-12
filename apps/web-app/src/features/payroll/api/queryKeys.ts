import type { PayrollEmployeesFilters } from '../types/payroll.types';

export const payrollKeys = {
  all: ['payroll'] as const,
  employees: () => [...payrollKeys.all, 'employees'] as const,
  employeeList: (filters: PayrollEmployeesFilters) =>
    [...payrollKeys.employees(), filters] as const,
  employee: (userId: string) => [...payrollKeys.employees(), 'detail', userId] as const,
};
