import { useQuery } from '@tanstack/react-query';

import { getAttendanceComparison } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type { AttendanceComparisonFilters } from '../types/attendance.types';

const REFETCH_INTERVAL_MS = 60_000;

export function useAttendanceComparisonQuery(filters: AttendanceComparisonFilters) {
  return useQuery({
    queryKey: attendanceKeys.comparison(filters),
    queryFn: () => getAttendanceComparison(filters),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
