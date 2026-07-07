import { useMemo, useState } from 'react';

import type { EmployeeContractType, PayrollEmployeesFilters } from '../types/payroll.types';
import type { EmployeeListExportQuery } from '../types/payroll-reports.types';

export type PayrollEmployeeStatusFilter = 'all' | 'active' | 'inactive';

export interface PayrollEmployeesFilterState {
  search: string;
  locationId: string;
  contractType: EmployeeContractType | 'all';
  statusFilter: PayrollEmployeeStatusFilter;
  positionId: string;
  area: string;
  department: string;
  page: number;
  pageSize: number;
}

export function usePayrollEmployeesFilters(defaultPageSize = 8) {
  const [state, setState] = useState<PayrollEmployeesFilterState>({
    search: '',
    locationId: '',
    contractType: 'all',
    statusFilter: 'all',
    positionId: '',
    area: '',
    department: '',
    page: 1,
    pageSize: defaultPageSize,
  });

  const queryFilters = useMemo<PayrollEmployeesFilters>(
    () => ({
      locationId: state.locationId || undefined,
      contractType: state.contractType === 'all' ? undefined : state.contractType,
      includeInactive: state.statusFilter !== 'active',
      isActive:
        state.statusFilter === 'active'
          ? true
          : state.statusFilter === 'inactive'
            ? false
            : undefined,
      positionId: state.positionId || undefined,
      area: state.area || undefined,
      department: state.department || undefined,
      search: state.search.trim() || undefined,
      limit: state.pageSize,
      offset: (state.page - 1) * state.pageSize,
    }),
    [state],
  );

  const exportFilters = useMemo<EmployeeListExportQuery>(
    () => ({
      locationId: state.locationId || undefined,
      contractType: state.contractType === 'all' ? undefined : state.contractType,
      isActive:
        state.statusFilter === 'active'
          ? true
          : state.statusFilter === 'inactive'
            ? false
            : undefined,
      positionId: state.positionId || undefined,
      area: state.area || undefined,
      department: state.department || undefined,
      search: state.search.trim() || undefined,
    }),
    [state],
  );

  return {
    state,
    setSearch: (search: string) => setState((prev) => ({ ...prev, search, page: 1 })),
    setLocationId: (locationId: string) => setState((prev) => ({ ...prev, locationId, page: 1 })),
    setContractType: (contractType: EmployeeContractType | 'all') =>
      setState((prev) => ({ ...prev, contractType, page: 1 })),
    setStatusFilter: (statusFilter: PayrollEmployeeStatusFilter) =>
      setState((prev) => ({ ...prev, statusFilter, page: 1 })),
    setPositionId: (positionId: string) => setState((prev) => ({ ...prev, positionId, page: 1 })),
    setArea: (area: string) => setState((prev) => ({ ...prev, area, page: 1 })),
    setDepartment: (department: string) => setState((prev) => ({ ...prev, department, page: 1 })),
    setPage: (page: number) => setState((prev) => ({ ...prev, page })),
    queryFilters,
    exportFilters,
  };
}
