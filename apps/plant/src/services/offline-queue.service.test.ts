import { describe, expect, it } from 'vitest';

import type { OfflineQueueItem } from './offline-queue.service';
import { offlineQueueRouting } from './offline-queue.service';

describe('offline-queue incident routing', () => {
  it('uses scoped incidents path when orderId is present', () => {
    const item: OfflineQueueItem = {
      id: 'q-1',
      type: 'incident.create',
      payload: {
        orderId: 'order-42',
        workStationId: 'ws-1',
        noveltyType: 'OTHER',
        severity: 'LOW',
        description: 'Detalle',
      },
      createdAt: Date.now(),
      retryCount: 0,
      idempotencyKey: 'incident:order-42:abc',
    };

    expect(offlineQueueRouting.resolveQueuePath(item)).toBe('/api/plant/orders/order-42/incidents');
    expect(offlineQueueRouting.resolveQueueBody(item)).toEqual({
      workStationId: 'ws-1',
      noveltyType: 'OTHER',
      severity: 'LOW',
      description: 'Detalle',
      requiresPause: false,
      stepId: null,
      locationId: null,
    });
  });

  it('falls back to legacy incidents path when orderId is missing', () => {
    const item: OfflineQueueItem = {
      id: 'q-2',
      type: 'incident.create',
      payload: {
        workStationId: 'ws-1',
        type: 'QUALITY',
        severity: 'WARNING',
        description: 'Legacy',
      },
      createdAt: Date.now(),
      retryCount: 0,
      idempotencyKey: 'incident:ws-1:abc',
    };

    expect(offlineQueueRouting.resolveQueuePath(item)).toBe('/api/plant/incidents');
    expect(offlineQueueRouting.resolveQueueBody(item)).toEqual(item.payload);
  });
});
