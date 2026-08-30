import { useQuery } from '@tanstack/react-query';

import { getAttendanceOvertimeSummary } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';

export function useAttendanceOvertimeQuery(userId?: string, date?: string) {
  return useQuery({
    queryKey: attendanceKeys.overtime(userId ?? 'none', date),
    queryFn: () => getAttendanceOvertimeSummary(userId as string, date),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}
