import { hydrateStationSession } from '@/services/station.service';
import { bindQueueFlushOnReconnect } from '@/services/offline-queue.service';
import { initCapgo } from '@/config/capgo';
import { useSessionStore } from '@/stores/session.store';
import { useTimerStore } from '@/stores/timer.store';
import { useConnectivityStore } from '@/stores/connectivity.store';

export interface BootstrapResult {
  stationId: string | null;
  needsSetup: boolean;
}

export async function bootstrapPlantApp(): Promise<BootstrapResult> {
  useTimerStore.getState().hydrate();
  useConnectivityStore.getState().startPingLoop();
  bindQueueFlushOnReconnect();
  await initCapgo();

  const { setStationId } = useSessionStore.getState();
  return hydrateStationSession(setStationId);
}
