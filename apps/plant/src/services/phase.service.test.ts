import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitPhaseCompletion } from './phase.service';

vi.mock('@/api/operator-order.api', () => ({
  completeProductionStep: vi.fn(),
}));

vi.mock('@/services/offline-queue.service', () => ({
  enqueue: vi.fn().mockResolvedValue({ id: 'q-1' }),
}));

vi.mock('@/stores/connectivity.store', () => ({
  useConnectivityStore: {
    getState: vi.fn(),
  },
}));

import { completeProductionStep } from '@/api/operator-order.api';
import { enqueue } from '@/services/offline-queue.service';
import { useConnectivityStore } from '@/stores/connectivity.store';

const payload = {
  opId: 'OP-000012',
  stationId: 'EST-02',
  stepId: 'exec-1',
  quantity: 48.5,
  unit: 'kg',
  notes: '',
  elapsedMs: 928_000,
  idempotencyKey: 'idem-1',
};

describe('phase.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls API when online and reachable', async () => {
    vi.mocked(useConnectivityStore.getState).mockReturnValue({
      isOnline: true,
      ping: vi.fn().mockResolvedValue(true),
    } as unknown as ReturnType<typeof useConnectivityStore.getState>);
    vi.mocked(completeProductionStep).mockResolvedValue({ id: 'OP-000012', status: 'IN_PROCESS' });

    const result = await submitPhaseCompletion(payload);

    expect(result).toBe('synced');
    expect(completeProductionStep).toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('enqueues when offline', async () => {
    vi.mocked(useConnectivityStore.getState).mockReturnValue({
      isOnline: false,
      ping: vi.fn().mockResolvedValue(false),
    } as unknown as ReturnType<typeof useConnectivityStore.getState>);

    const result = await submitPhaseCompletion(payload);

    expect(result).toBe('queued');
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'order.complete-step', idempotencyKey: 'idem-1' }),
    );
  });
});
