import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { attendanceKeys } from '../api/queryKeys';
import { getOrCreateWeeklyShiftPlan } from '../api/weekly-shift-plan.api';
import type { WeeklyShiftPlan, WeeklyShiftPlanStatus } from '../types/weekly-shift-plan.types';

export function useWeeklyShiftPlansQuery(
  locationIds: string[],
  weekStart: string,
): {
  plans: WeeklyShiftPlan[];
  planByLocationId: Map<string, WeeklyShiftPlan>;
  statusByLocationId: Map<string, WeeklyShiftPlanStatus>;
  isLoading: boolean;
  isError: boolean;
} {
  const uniqueIds = useMemo(() => [...new Set(locationIds.filter(Boolean))], [locationIds]);

  const queries = useQueries({
    queries: uniqueIds.map((locationId) => ({
      queryKey: attendanceKeys.weeklyShiftPlan(locationId, weekStart),
      queryFn: () => getOrCreateWeeklyShiftPlan({ locationId, weekStart }),
      enabled: Boolean(locationId && weekStart),
      staleTime: 30_000,
    })),
  });

  const plans = useMemo(
    () =>
      queries.map((query) => query.data).filter((plan): plan is WeeklyShiftPlan => Boolean(plan)),
    [queries],
  );

  const planByLocationId = useMemo(() => {
    const map = new Map<string, WeeklyShiftPlan>();
    plans.forEach((plan) => map.set(plan.locationId, plan));
    return map;
  }, [plans]);

  const statusByLocationId = useMemo(() => {
    const map = new Map<string, WeeklyShiftPlanStatus>();
    plans.forEach((plan) => map.set(plan.locationId, plan.status));
    return map;
  }, [plans]);

  return {
    plans,
    planByLocationId,
    statusByLocationId,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
  };
}
