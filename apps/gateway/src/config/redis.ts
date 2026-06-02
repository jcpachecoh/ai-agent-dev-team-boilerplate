import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logging';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 500;

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | null | undefined;
}

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number): number | null {
      if (times > MAX_RETRIES) {
        logger.error({ times }, 'Redis max retries exceeded — giving up');
        return null;
      }
      const delay = Math.min(times * RETRY_DELAY_MS, 5000);
      logger.warn({ times, delay }, 'Redis reconnecting...');
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('ready', () => logger.info('Redis ready'));
  client.on('error', (err: Error) => logger.error({ err }, 'Redis error'));
  client.on('close', () => logger.warn('Redis connection closed'));
  client.on('reconnecting', () => logger.warn('Redis reconnecting'));
  client.on('end', () => logger.error('Redis connection ended'));

  return client;
}

export const redis: Redis | null = env.REDIS_URL
  ? (global.__redis ?? (global.__redis = createRedisClient()))
  : null;

if (!env.isProduction && redis) {
  global.__redis = redis;
}
