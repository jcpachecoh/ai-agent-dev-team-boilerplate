import type Redis from 'ioredis';

import type { EmailFailedEvent } from './types';

export async function publishEmailFailedEvent(
  redis: Redis,
  event: EmailFailedEvent,
): Promise<void> {
  try {
    await redis.publish('email:failed', JSON.stringify(event));
  } catch (error) {
    console.error('[EmailWorker] Failed to publish email:failed event', {
      jobId: event.jobId,
      error,
    });
  }
}
