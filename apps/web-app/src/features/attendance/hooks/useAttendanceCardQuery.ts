import { useQuery } from '@tanstack/react-query';

import { getAttendanceCard } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';

interface UseAttendanceCardQueryParams {
  userId: string;
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  enabled?: boolean;
}

export function useAttendanceCardQuery({
  userId,
  dateFrom,
  dateTo,
  locationId,
  enabled = true,
}: UseAttendanceCardQueryParams) {
  return useQuery({
    queryKey: [...attendanceKeys.card(userId, dateFrom, dateTo), locationId ?? ''] as const,
    queryFn: () => getAttendanceCard(userId, dateFrom, dateTo, locationId),
    enabled: enabled && Boolean(userId && dateFrom && dateTo),
  });
}
