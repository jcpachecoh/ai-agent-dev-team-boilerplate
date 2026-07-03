import { useMemo } from 'react';

import { useAttendanceHistoryQuery } from './useAttendanceHistoryQuery';
import {
  buildAttendanceCardRows,
  buildAttendanceCardSummaryMetrics,
} from '../mappers/attendance-card.mapper';

interface UseAttendanceCardDataParams {
  userId: string;
  employeeId: string;
  locationId: string;
  fromIso: string;
  toIso: string;
  enabled?: boolean;
  revision?: number;
}

export function useAttendanceCardData({
  userId,
  employeeId,
  locationId,
  fromIso,
  toIso,
  enabled = true,
  revision = 0,
}: UseAttendanceCardDataParams) {
  const historyQuery = useAttendanceHistoryQuery({
    userId,
    locationId,
    dateFrom: fromIso,
    dateTo: toIso,
    limit: 100,
  });

  const rows = useMemo(() => {
    if (!enabled || !historyQuery.data) return [];
    return buildAttendanceCardRows(employeeId, fromIso, toIso, historyQuery.data);
  }, [enabled, employeeId, fromIso, toIso, historyQuery.data, revision]);

  const summary = useMemo(() => buildAttendanceCardSummaryMetrics(rows), [rows]);

  return {
    historyQuery,
    rows,
    summary,
  };
}
