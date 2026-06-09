import { useQuery } from '@tanstack/react-query';

import { fetchSupervisorOverview, fetchSupervisorStations } from '../api/supervisor.api';
import { supervisorKeys } from '../api/supervisor.keys';

const REFRESH_MS = 30_000;

export function useSupervisorOverview() {
  return useQuery({
    queryKey: supervisorKeys.overview(),
    queryFn: fetchSupervisorOverview,
    refetchInterval: REFRESH_MS,
  });
}

export function useSupervisorStations() {
  return useQuery({
    queryKey: supervisorKeys.stations(),
    queryFn: fetchSupervisorStations,
  });
}
