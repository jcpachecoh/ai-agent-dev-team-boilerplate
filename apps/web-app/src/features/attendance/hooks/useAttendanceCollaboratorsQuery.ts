import { useQuery } from '@tanstack/react-query';

import { listAttendanceCollaborators } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type { AttendanceCollaboratorsFilters } from '../types/attendance.types';

export function useAttendanceCollaboratorsQuery(filters: AttendanceCollaboratorsFilters) {
  return useQuery({
    queryKey: attendanceKeys.collaborators(filters),
    queryFn: () => listAttendanceCollaborators(filters),
    placeholderData: (previousData) => previousData,
  });
}
