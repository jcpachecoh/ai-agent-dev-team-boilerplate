import { useQuery } from '@tanstack/react-query';

import { fetchSupervisorStationLive } from '../api/supervisor.api';
import { supervisorKeys } from '../api/supervisor.keys';

const REFRESH_MS = 10_000;

export function useSupervisorStationLiveDetail(stationId: string | undefined) {
  return useQuery({
    queryKey: supervisorKeys.stationLive(stationId ?? ''),
    queryFn: () => fetchSupervisorStationLive(stationId!),
    enabled: Boolean(stationId),
    refetchInterval: REFRESH_MS,
  });
}
