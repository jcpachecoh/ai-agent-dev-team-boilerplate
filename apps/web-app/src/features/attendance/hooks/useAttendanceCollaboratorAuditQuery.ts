import { useQuery } from '@tanstack/react-query';

import { getAttendanceCollaboratorAudit } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';

export function useAttendanceCollaboratorAuditQuery(employeeDetailsId: string | undefined) {
  return useQuery({
    queryKey: attendanceKeys.collaboratorAudit(employeeDetailsId ?? ''),
    queryFn: () => getAttendanceCollaboratorAudit(employeeDetailsId as string),
    enabled: Boolean(employeeDetailsId),
  });
}
