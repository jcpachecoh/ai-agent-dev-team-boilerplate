import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  completeProductionStep,
  finishProductionOrder,
  pauseProductionOrder,
  resumeProductionOrder,
  startProductionOrder,
} from '@/api/operator-order.api';
import { PlantApiError } from '@/services/plant-api.service';
import { enqueue } from '@/services/offline-queue.service';
import { useConnectivityStore } from '@/stores/connectivity.store';

import { orderRecipeQueryKey } from './useOrderRecipe';

export type RuntimeMutationResult = 'synced' | 'queued';

const PING_FRESH_MS = 8_000;

async function isApiReachable(): Promise<boolean> {
  const { isOnline, lastPingAt, ping } = useConnectivityStore.getState();
  if (!isOnline) return false;
  if (lastPingAt && Date.now() - lastPingAt < PING_FRESH_MS) {
    return true;
  }
  return ping();
}

async function runOrQueue(
  idempotencyKey: string,
  queueType:
    | 'order.start'
    | 'order.pause'
    | 'order.resume'
    | 'order.complete-step'
    | 'order.finish',
  payload: Record<string, unknown>,
  apiCall: () => Promise<unknown>,
): Promise<RuntimeMutationResult> {
  const { isOnline } = useConnectivityStore.getState();

  if (isOnline) {
    const reachable = await isApiReachable();
    if (reachable) {
      try {
        await apiCall();
        return 'synced';
      } catch (error) {
        if (error instanceof PlantApiError) {
          throw error;
        }
        // fall through to offline queue for network failures
      }
    }
  }

  await enqueue({
    type: queueType,
    idempotencyKey,
    payload,
  });
  return 'queued';
}

export function useOrderRuntimeActions(orderId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!orderId) return;
    await queryClient.refetchQueries({ queryKey: orderRecipeQueryKey(orderId) });
    await queryClient.refetchQueries({ queryKey: ['order-live-status', orderId] });
  };

  const startMutation = useMutation({
    mutationFn: async ({
      workStationId,
      idempotencyKey,
    }: {
      workStationId: string;
      idempotencyKey: string;
    }) => {
      const result = await runOrQueue(
        idempotencyKey,
        'order.start',
        { orderId, workStationId },
        () => startProductionOrder(orderId!, workStationId, idempotencyKey),
      );
      await invalidate();
      return result;
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async ({ notes, idempotencyKey }: { notes?: string; idempotencyKey: string }) => {
      const result = await runOrQueue(idempotencyKey, 'order.pause', { orderId, notes }, () =>
        pauseProductionOrder(orderId!, notes, idempotencyKey),
      );
      await invalidate();
      return result;
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async ({ idempotencyKey }: { idempotencyKey: string }) => {
      const result = await runOrQueue(idempotencyKey, 'order.resume', { orderId }, () =>
        resumeProductionOrder(orderId!, idempotencyKey),
      );
      await invalidate();
      return result;
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: async ({
      stepId,
      actualMinutes,
      producedQuantity,
      notes,
      idempotencyKey,
    }: {
      stepId: string;
      actualMinutes?: number;
      producedQuantity?: string;
      notes?: string;
      idempotencyKey: string;
    }) => {
      const result = await runOrQueue(
        idempotencyKey,
        'order.complete-step',
        { orderId, stepId, actualMinutes, producedQuantity, notes },
        () =>
          completeProductionStep(
            orderId!,
            stepId,
            { actualMinutes, producedQuantity, notes },
            idempotencyKey,
          ),
      );
      await invalidate();
      return result;
    },
  });

  const finishMutation = useMutation({
    mutationFn: async ({ notes, idempotencyKey }: { notes?: string; idempotencyKey: string }) => {
      const result = await runOrQueue(idempotencyKey, 'order.finish', { orderId, notes }, () =>
        finishProductionOrder(orderId!, notes, idempotencyKey),
      );
      await invalidate();
      return result;
    },
  });

  return {
    startMutation,
    pauseMutation,
    resumeMutation,
    completeStepMutation,
    finishMutation,
  };
}
