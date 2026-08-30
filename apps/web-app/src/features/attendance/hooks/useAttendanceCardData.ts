import { useMemo } from 'react';

import { useAttendanceCardQuery } from './useAttendanceCardQuery';
import {
  buildAttendanceCardRows,
  buildAttendanceCardSummaryMetrics,
} from '../mappers/attendance-card.mapper';

interface UseAttendanceCardDataParams {
  userId: string;
  fromIso: string;
  toIso: string;
  enabled?: boolean;
}

export function useAttendanceCardData({
  userId,
  fromIso,
  toIso,
  enabled = true,
}: UseAttendanceCardDataParams) {
  const cardQuery = useAttendanceCardQuery({ userId, dateFrom: fromIso, dateTo: toIso, enabled });

  const rows = useMemo(() => {
    if (!enabled || !cardQuery.data) return [];
    return buildAttendanceCardRows(
      fromIso,
      toIso,
      cardQuery.data.logs,
      cardQuery.data.observations,
      cardQuery.data.daySummaries ?? [],
    );
  }, [enabled, fromIso, toIso, cardQuery.data]);

  const summary = useMemo(() => buildAttendanceCardSummaryMetrics(rows), [rows]);

  return {
    cardQuery,
    rows,
    summary,
  };
}
