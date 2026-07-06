import { useQuery } from '@tanstack/react-query';

import { listAttendanceCollaboratorSupervisors } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';

export function useAttendanceCollaboratorSupervisorsQuery() {
  return useQuery({
    queryKey: attendanceKeys.collaboratorSupervisors(),
    queryFn: () => listAttendanceCollaboratorSupervisors(),
    staleTime: 5 * 60 * 1000,
  });
}
