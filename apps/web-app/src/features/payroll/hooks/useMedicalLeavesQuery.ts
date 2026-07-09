import { useQuery } from '@tanstack/react-query';

import { getMedicalLeaveById, listMedicalLeaves } from '../api/medical-leaves.client';
import { payrollKeys } from '../api/queryKeys';
import type { ListMedicalLeavesFilters } from '../types/medical-leaves.types';

export function useMedicalLeavesQuery(filters: ListMedicalLeavesFilters, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.medicalLeaveList(filters),
    queryFn: () => listMedicalLeaves(filters),
    enabled,
  });
}

export function useMedicalLeaveDetailQuery(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.medicalLeaveDetail(id ?? ''),
    queryFn: () => getMedicalLeaveById(id!),
    enabled: enabled && !!id,
  });
}
