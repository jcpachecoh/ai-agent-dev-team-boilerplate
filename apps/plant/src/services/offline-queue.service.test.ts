import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { enqueue, flushQueue, listQueue } from './offline-queue.service';
import { useConnectivityStore } from '@/stores/connectivity.store';

describe('offline-queue.service', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    useConnectivityStore.setState({ isOnline: true, syncQueueCount: 0 });
    const { idbSet } = await import('@/utils/storage');
    await idbSet(STORAGE_KEYS.offlineQueue, []);
  });

  it('deduplicates by idempotencyKey', async () => {
    const a = await enqueue({
      type: 'incident.create',
      payload: { note: 'a' },
      idempotencyKey: 'key-1',
    });
    const b = await enqueue({
      type: 'incident.create',
      payload: { note: 'b' },
      idempotencyKey: 'key-1',
    });
    expect(a.id).toBe(b.id);
    const list = await listQueue();
    expect(list).toHaveLength(1);
  });

  it('flushes when online and API ok', async () => {
    vi.spyOn(useConnectivityStore.getState(), 'ping').mockResolvedValue(true);
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);

    await enqueue({
      type: 'incident.create',
      payload: { stationId: 'EST-02' },
      idempotencyKey: 'flush-1',
    });

    const result = await flushQueue();
    expect(result.synced).toBe(1);
    expect(await listQueue()).toHaveLength(0);
  });
});
