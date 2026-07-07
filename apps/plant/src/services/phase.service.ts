import { enqueue } from '@/services/offline-queue.service';
import { completeProductionStep } from '@/api/operator-order.api';
import { useConnectivityStore } from '@/stores/connectivity.store';

export interface CompletePhasePayload {
  opId: string;
  stationId: string;
  stepId: string;
  quantity: number;
  unit: string;
  notes?: string;
  elapsedMs: number;
  idempotencyKey: string;
}

export type CompletePhaseResult = 'synced' | 'queued';

async function completePhaseViaApi(payload: CompletePhasePayload): Promise<void> {
  await completeProductionStep(
    payload.opId,
    payload.stepId,
    {
      actualMinutes: Math.max(1, Math.round(payload.elapsedMs / 60_000)),
      producedQuantity: String(payload.quantity),
      notes: payload.notes,
    },
    payload.idempotencyKey,
  );
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
    type: 'order.complete-step',
    idempotencyKey: payload.idempotencyKey,
    payload: payload as unknown as Record<string, unknown>,
  });
  return 'queued';
}
