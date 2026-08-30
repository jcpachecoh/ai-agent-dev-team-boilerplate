import { useQuery } from '@tanstack/react-query';

import { getAttendanceControlPanel } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type { AttendanceControlPanelFilters } from '../types/attendance.types';

const REFETCH_INTERVAL_MS = 60_000;

export function useAttendanceControlPanelQuery(filters: AttendanceControlPanelFilters) {
  return useQuery({
    queryKey: attendanceKeys.controlPanel(filters),
    queryFn: () => getAttendanceControlPanel(filters),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
