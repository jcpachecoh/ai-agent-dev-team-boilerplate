import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listAttendanceCollaborators } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type {
  AttendanceCollaboratorsFilters,
  AttendanceCollaboratorsResult,
} from '../types/attendance.types';

export function useAttendanceCollaboratorsQuery(
  filters: AttendanceCollaboratorsFilters,
  enabled = true,
): UseQueryResult<AttendanceCollaboratorsResult> {
  return useQuery({
    queryKey: attendanceKeys.collaborators(filters),
    queryFn: () => listAttendanceCollaborators(filters),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}
