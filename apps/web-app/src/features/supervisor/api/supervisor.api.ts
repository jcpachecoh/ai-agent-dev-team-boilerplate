import { plantFetch } from '@/api/plant/client';

import type {
  SupervisorOverviewResponse,
  SupervisorStationLiveDetail,
  SupervisorStationsResponse,
} from '../types';

export function fetchSupervisorOverview(): Promise<SupervisorOverviewResponse> {
  return plantFetch<SupervisorOverviewResponse>('/plant/supervisor/overview');
}

export function fetchSupervisorStations(): Promise<SupervisorStationsResponse> {
  return plantFetch<SupervisorStationsResponse>('/plant/supervisor/stations');
}

export function fetchSupervisorStationLive(
  stationId: string,
): Promise<SupervisorStationLiveDetail> {
  return plantFetch<SupervisorStationLiveDetail>(`/plant/supervisor/stations/${stationId}/live`);
}
