import { useQuery } from '@tanstack/react-query';

import { listAttendanceHistory } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type { AttendanceHistoryFilters } from '../types/attendance.types';

export function useAttendanceHistoryQuery(filters: AttendanceHistoryFilters) {
  return useQuery({
    queryKey: attendanceKeys.historyList(filters),
    queryFn: () => listAttendanceHistory(filters),
    refetchInterval: 30_000,
  });
}
