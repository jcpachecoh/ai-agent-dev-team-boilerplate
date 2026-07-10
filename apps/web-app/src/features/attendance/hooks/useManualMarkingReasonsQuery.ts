import { useQuery } from '@tanstack/react-query';

import { fetchManualMarkingReasons } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';

export function useManualMarkingReasonsQuery(enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.manualMarkingReasons(),
    queryFn: () => fetchManualMarkingReasons(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
