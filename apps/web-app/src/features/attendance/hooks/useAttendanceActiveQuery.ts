import { useQuery } from '@tanstack/react-query';

import { listAttendanceActive } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';

export function useAttendanceActiveQuery(locationId?: string) {
  return useQuery({
    queryKey: attendanceKeys.active(locationId ?? 'none'),
    queryFn: () => listAttendanceActive(locationId as string),
    enabled: Boolean(locationId),
    refetchInterval: 30_000,
  });
}
