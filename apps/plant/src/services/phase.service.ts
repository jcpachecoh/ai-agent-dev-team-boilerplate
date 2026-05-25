import { enqueue } from '@/services/offline-queue.service';
import { plantFetch } from '@/services/plant-api.service';
import { useConnectivityStore } from '@/stores/connectivity.store';

export interface CompletePhasePayload {
  opId: string;
  stationId: string;
  quantity: number;
  unit: string;
  notes?: string;
  elapsedMs: number;
  idempotencyKey: string;
}

export type CompletePhaseResult = 'synced' | 'queued';

async function completePhaseViaApi(payload: CompletePhasePayload): Promise<void> {
  await plantFetch<{ ok: boolean }>('/api/plant/phases/complete', {
    method: 'POST',
    headers: { 'Idempotency-Key': payload.idempotencyKey },
    body: JSON.stringify(payload),
  });
}

/**
 * Persists phase completion via API when online, otherwise enqueues for sync.
 */
export async function submitPhaseCompletion(
  payload: CompletePhasePayload,
): Promise<CompletePhaseResult> {
  const { isOnline, ping } = useConnectivityStore.getState();

  if (isOnline) {
    const reachable = await ping();
    if (reachable) {
      try {
        await completePhaseViaApi(payload);
        return 'synced';
      } catch {
        // fall through to offline queue
      }
    }
  }

  await enqueue({
    type: 'phase.complete',
    idempotencyKey: payload.idempotencyKey,
    payload: payload as unknown as Record<string, unknown>,
  });
  return 'queued';
}
