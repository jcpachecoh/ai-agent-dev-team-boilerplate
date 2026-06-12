import { useMemo, useState } from 'react';

import type { EmployeeContractType, PayrollEmployeesFilters } from '../types/payroll.types';

export interface PayrollEmployeesFilterState {
  search: string;
  locationId: string;
  contractType: EmployeeContractType | 'all';
  includeInactive: boolean;
  page: number;
  pageSize: number;
}

export function usePayrollEmployeesFilters(defaultPageSize = 20) {
  const [state, setState] = useState<PayrollEmployeesFilterState>({
    search: '',
    locationId: '',
    contractType: 'all',
    includeInactive: false,
    page: 1,
    pageSize: defaultPageSize,
  });

  const queryFilters = useMemo<PayrollEmployeesFilters>(
    () => ({
      locationId: state.locationId || undefined,
      contractType: state.contractType === 'all' ? undefined : state.contractType,
      includeInactive: state.includeInactive,
      limit: state.pageSize,
      offset: (state.page - 1) * state.pageSize,
    }),
    [state],
  );

  return {
    state,
    setSearch: (search: string) => setState((prev) => ({ ...prev, search, page: 1 })),
    setLocationId: (locationId: string) => setState((prev) => ({ ...prev, locationId, page: 1 })),
    setContractType: (contractType: EmployeeContractType | 'all') =>
      setState((prev) => ({ ...prev, contractType, page: 1 })),
    setIncludeInactive: (includeInactive: boolean) =>
      setState((prev) => ({ ...prev, includeInactive, page: 1 })),
    setPage: (page: number) => setState((prev) => ({ ...prev, page })),
    queryFilters,
  };
}
