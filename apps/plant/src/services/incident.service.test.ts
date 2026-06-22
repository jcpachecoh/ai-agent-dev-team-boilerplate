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
import { reportIncident } from './incident.service';
import { plantFetch } from './plant-api.service';

const baseInput = {
  workStationId: 'ws-1',
  orderId: 'order-1',
  type: 'QUALITY' as const,
  severity: 'WARNING' as const,
  description: 'Producto fuera de spec',
};

describe('incident.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts incident when online', async () => {
    vi.mocked(useConnectivityStore.getState).mockReturnValue({
      isOnline: true,
    } as ReturnType<typeof useConnectivityStore.getState>);
    vi.mocked(plantFetch).mockResolvedValue({ id: 'inc-1' });

    const result = await reportIncident(baseInput);

    expect(plantFetch).toHaveBeenCalledWith(
      '/api/plant/incidents',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.queued).toBe(false);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('enqueues incident when offline', async () => {
    vi.mocked(useConnectivityStore.getState).mockReturnValue({
      isOnline: false,
    } as ReturnType<typeof useConnectivityStore.getState>);

    const result = await reportIncident(baseInput, 'data:image/jpeg;base64,abc');

    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'incident.create',
        imageBase64: 'data:image/jpeg;base64,abc',
      }),
    );
    expect(result.queued).toBe(true);
    expect(result.hasPhoto).toBe(true);
  });

  it('rejects empty description', async () => {
    await expect(reportIncident({ ...baseInput, description: '  ' })).rejects.toThrow(
      'La descripción del incidente es obligatoria',
    );
  });
});
