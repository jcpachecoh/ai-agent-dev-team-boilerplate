import { useQuery } from '@tanstack/react-query';

import { getAttendanceCard } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';

interface UseAttendanceCardQueryParams {
  userId: string;
  dateFrom: string;
  dateTo: string;
  enabled?: boolean;
}

export function useAttendanceCardQuery({
  userId,
  dateFrom,
  dateTo,
  enabled = true,
}: UseAttendanceCardQueryParams) {
  return useQuery({
    queryKey: attendanceKeys.card(userId, dateFrom, dateTo),
    queryFn: () => getAttendanceCard(userId, dateFrom, dateTo),
    enabled: enabled && Boolean(userId && dateFrom && dateTo),
  });
}
