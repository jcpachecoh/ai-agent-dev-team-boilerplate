import { useState } from 'react';

import type { EmployeeContractType } from '@/features/payroll/types/payroll.types';

import type { AttendanceCollaboratorsFilters } from '../types/attendance.types';
import type { LaborClassificationFilterValue } from '../utils/labor-classification';

export type AttendanceCollaboratorsStatusFilter = 'all' | 'active' | 'inactive';

export const ATTENDANCE_COLLABORATORS_PAGE_SIZE_OPTIONS = [8, 20, 50, 100] as const;
export type AttendanceCollaboratorsPageSize =
  (typeof ATTENDANCE_COLLABORATORS_PAGE_SIZE_OPTIONS)[number];

export interface AttendanceCollaboratorsFilterState {
  search: string;
  area: string;
  contractType: EmployeeContractType | 'all';
  locationId: string;
  positionId: string;
  supervisorUserId: string;
  statusFilter: AttendanceCollaboratorsStatusFilter;
  page: number;
  pageSize: AttendanceCollaboratorsPageSize;
}

const INITIAL_STATE: Omit<AttendanceCollaboratorsFilterState, 'pageSize'> = {
  search: '',
  area: 'all',
  contractType: 'all',
  locationId: 'all',
  positionId: 'all',
  supervisorUserId: 'all',
  statusFilter: 'all',
  page: 1,
};

/**
 * La clasificación laboral (Especialidad operativa) vive en un store global
 * compartido entre pantallas de asistencia (`attendance-labor-filter.store.ts`),
 * no en este hook — se combina con `queryFilters` en el sitio de uso.
 */
export function useAttendanceCollaboratorsFilters(
  defaultPageSize: AttendanceCollaboratorsPageSize = 20,
) {
  const [state, setState] = useState<AttendanceCollaboratorsFilterState>({
    ...INITIAL_STATE,
    pageSize: defaultPageSize,
  });

  const resetPage = <K extends keyof AttendanceCollaboratorsFilterState>(
    patch: Pick<AttendanceCollaboratorsFilterState, K>,
  ) => setState((prev) => ({ ...prev, ...patch, page: 1 }));

  const buildQueryFilters = (
    laborClassification: LaborClassificationFilterValue,
  ): AttendanceCollaboratorsFilters => {
    const filters: AttendanceCollaboratorsFilters = {
      status: state.statusFilter,
      page: state.page,
      pageSize: state.pageSize,
    };

    if (state.search.trim()) filters.search = state.search.trim();
    if (state.area !== 'all') filters.area = state.area;
    if (state.contractType !== 'all') filters.contractType = state.contractType;
    if (state.locationId !== 'all') filters.locationId = state.locationId;
    if (state.positionId !== 'all') filters.positionId = state.positionId;
    if (state.supervisorUserId !== 'all') filters.supervisorUserId = state.supervisorUserId;
    if (laborClassification !== 'all') filters.laborClassification = laborClassification;

    return filters;
  };

  return {
    state,
    buildQueryFilters,
    setSearch: (search: string) => resetPage({ search }),
    setArea: (area: string) => resetPage({ area }),
    setContractType: (contractType: EmployeeContractType | 'all') => resetPage({ contractType }),
    setLocationId: (locationId: string) => resetPage({ locationId }),
    setPositionId: (positionId: string) => resetPage({ positionId }),
    setSupervisorUserId: (supervisorUserId: string) => resetPage({ supervisorUserId }),
    setStatusFilter: (statusFilter: AttendanceCollaboratorsStatusFilter) =>
      resetPage({ statusFilter }),
    setPage: (page: number) => setState((prev) => ({ ...prev, page })),
    setPageSize: (pageSize: AttendanceCollaboratorsPageSize) =>
      setState((prev) => ({ ...prev, pageSize, page: 1 })),
    resetFilters: () => setState({ ...INITIAL_STATE, pageSize: state.pageSize }),
  };
}
