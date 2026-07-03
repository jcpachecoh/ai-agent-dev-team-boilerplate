import { useQuery } from '@tanstack/react-query';

import { attendanceKeys } from '../api/queryKeys';
import { getWeeklyAssignments } from '../api/turno-assignments.api';
import type { WeeklyAssignmentsQuery } from '../types/turno-assignments.types';

export function useWeeklyAssignmentsQuery(filters: WeeklyAssignmentsQuery) {
  return useQuery({
    queryKey: attendanceKeys.turnoAssignments.weekly(filters),
    queryFn: () => getWeeklyAssignments(filters),
    placeholderData: (previous) => previous,
  });
}
