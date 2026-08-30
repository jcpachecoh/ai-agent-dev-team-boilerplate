import { useQuery } from '@tanstack/react-query';

import { getAttendanceMonitorSummary } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type { AttendanceMonitorPeriod } from '../types/attendance.types';

interface UseAttendanceMonitorSummaryOptions {
  locationId?: string;
  period?: AttendanceMonitorPeriod;
  anchorDate?: string;
  enabled?: boolean;
  refetchInterval?: number | false | ((data: { isLive?: boolean } | undefined) => number | false);
}

export function useAttendanceMonitorSummary({
  locationId,
  period = 'day',
  anchorDate,
  enabled = true,
  refetchInterval = false,
}: UseAttendanceMonitorSummaryOptions) {
  return useQuery({
    queryKey: attendanceKeys.monitorSummary(locationId ?? '', period, anchorDate ?? ''),
    queryFn: () =>
      getAttendanceMonitorSummary(locationId!, {
        period,
        anchorDate: anchorDate!,
      }),
    enabled: enabled && Boolean(locationId && anchorDate),
    refetchInterval:
      typeof refetchInterval === 'function'
        ? (query) => refetchInterval(query.state.data)
        : refetchInterval,
  });
}
