import { useState } from 'react';

import type { EmployeeContractType } from '@/features/payroll/types/payroll.types';

export type AttendanceCollaboratorsStatusFilter = 'all' | 'active' | 'inactive';

export interface AttendanceCollaboratorsFilterState {
  search: string;
  area: string;
  contractType: EmployeeContractType | 'all';
  locationId: string;
  statusFilter: AttendanceCollaboratorsStatusFilter;
  page: number;
  pageSize: number;
}

export function useAttendanceCollaboratorsFilters(defaultPageSize = 8) {
  const [state, setState] = useState<AttendanceCollaboratorsFilterState>({
    search: '',
    area: 'all',
    contractType: 'all',
    locationId: 'all',
    statusFilter: 'all',
    page: 1,
    pageSize: defaultPageSize,
  });

  const resetPage = <K extends keyof AttendanceCollaboratorsFilterState>(
    patch: Pick<AttendanceCollaboratorsFilterState, K>,
  ) => setState((prev) => ({ ...prev, ...patch, page: 1 }));

  return {
    state,
    setSearch: (search: string) => resetPage({ search }),
    setArea: (area: string) => resetPage({ area }),
    setContractType: (contractType: EmployeeContractType | 'all') => resetPage({ contractType }),
    setLocationId: (locationId: string) => resetPage({ locationId }),
    setStatusFilter: (statusFilter: AttendanceCollaboratorsStatusFilter) =>
      resetPage({ statusFilter }),
    setPage: (page: number) => setState((prev) => ({ ...prev, page })),
  };
}
