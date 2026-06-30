import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./plant-api.service', () => ({
  plantFetch: vi.fn(),
}));

vi.mock('./offline-queue.service', () => ({
  compressImageBase64: vi.fn(async (value: string) => value),
  enqueue: vi.fn(),
}));

vi.mock('@/stores/connectivity.store', () => ({
  useConnectivityStore: {
    getState: vi.fn(),
  },
}));

import { useConnectivityStore } from '@/stores/connectivity.store';

import { enqueue } from './offline-queue.service';
import { fetchOrderNovelties, reportOrderNovelty } from './incident.service';
import { plantFetch } from './plant-api.service';

const baseInput = {
  workStationId: 'ws-1',
  noveltyType: 'UNPLANNED_STOP' as const,
  severity: 'HIGH' as const,
  description: 'Parada no planificada',
  requiresPause: true,
  stepId: 'exec-1',
};

describe('incident.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts order novelty when online', async () => {
    vi.mocked(useConnectivityStore.getState).mockReturnValue({
      isOnline: true,
    } as ReturnType<typeof useConnectivityStore.getState>);
    vi.mocked(plantFetch).mockResolvedValue({ id: 'inc-1' });

    const result = await reportOrderNovelty('order-1', baseInput);

    expect(plantFetch).toHaveBeenCalledWith(
      '/api/plant/orders/order-1/incidents',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.queued).toBe(false);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('enqueues order novelty when offline with extended payload', async () => {
    vi.mocked(useConnectivityStore.getState).mockReturnValue({
      isOnline: false,
    } as ReturnType<typeof useConnectivityStore.getState>);

    const result = await reportOrderNovelty('order-1', baseInput, 'data:image/jpeg;base64,abc');

    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'incident.create',
        payload: expect.objectContaining({
          orderId: 'order-1',
          noveltyType: 'UNPLANNED_STOP',
          requiresPause: true,
          severity: 'HIGH',
        }),
        imageBase64: 'data:image/jpeg;base64,abc',
      }),
    );
    expect(result.queued).toBe(true);
    expect(result.hasPhoto).toBe(true);
  });

  it('fetches and maps order novelties', async () => {
    vi.mocked(plantFetch).mockResolvedValue([
      {
        id: 'inc-1',
        orderId: 'order-1',
        workStationId: 'ws-1',
        noveltyType: 'QUALITY_ISSUE',
        severity: 'WARNING',
        description: 'Fuera de spec',
        requiresPause: false,
        createdAt: '2026-06-30T12:00:00.000Z',
        resolvedAt: null,
      },
    ]);

    const result = await fetchOrderNovelties('order-1');

    expect(plantFetch).toHaveBeenCalledWith('/api/plant/orders/order-1/incidents');
    expect(result).toHaveLength(1);
    expect(result[0]?.severity).toBe('MEDIUM');
    expect(result[0]?.noveltyType).toBe('QUALITY_ISSUE');
  });

  it('rejects empty description', async () => {
    await expect(
      reportOrderNovelty('order-1', { ...baseInput, description: '  ' }),
    ).rejects.toThrow('La descripción de la novedad es obligatoria');
  });
});
