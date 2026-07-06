import { useMemo, useState } from 'react';

import type { WeeklyAssignmentsQuery } from '../types/turno-assignments.types';
import { addWeeks, formatDateOnly, getMondayOfWeek } from '../utils/week.utils';

const PAGE_SIZE = 50;

export function useWeeklyAssignmentsFilters() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [search, setSearch] = useState('');

  const queryFilters = useMemo<WeeklyAssignmentsQuery>(
    () => ({
      weekStart: formatDateOnly(weekStart),
      search: search.trim() || undefined,
      page: 1,
      limit: PAGE_SIZE,
    }),
    [weekStart, search],
  );

  const goToPreviousWeek = () => setWeekStart((current) => addWeeks(current, -1));
  const goToNextWeek = () => setWeekStart((current) => addWeeks(current, 1));
  const goToToday = () => setWeekStart(getMondayOfWeek(new Date()));

  return {
    weekStart,
    search,
    setSearch,
    queryFilters,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
  };
}
