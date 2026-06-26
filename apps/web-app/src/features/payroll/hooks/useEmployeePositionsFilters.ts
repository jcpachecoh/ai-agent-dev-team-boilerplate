import { useMemo, useState } from 'react';

import type { ListEmployeePositionsFilters } from '../types/employee-position.types';

export type EmployeePositionStatusFilter = 'all' | 'active' | 'inactive';

export interface EmployeePositionsFilterState {
  search: string;
  statusFilter: EmployeePositionStatusFilter;
  page: number;
  pageSize: number;
}

export function useEmployeePositionsFilters(defaultPageSize = 8) {
  const [state, setState] = useState<EmployeePositionsFilterState>({
    search: '',
    statusFilter: 'all',
    page: 1,
    pageSize: defaultPageSize,
  });

  const queryFilters = useMemo<ListEmployeePositionsFilters>(
    () => ({
      includeInactive: state.statusFilter !== 'active',
      search: state.search.trim() || undefined,
    }),
    [state.search, state.statusFilter],
  );

  return {
    state,
    setSearch: (search: string) => setState((prev) => ({ ...prev, search, page: 1 })),
    setStatusFilter: (statusFilter: EmployeePositionStatusFilter) =>
      setState((prev) => ({ ...prev, statusFilter, page: 1 })),
    setPage: (page: number) => setState((prev) => ({ ...prev, page })),
    queryFilters,
  };
}
