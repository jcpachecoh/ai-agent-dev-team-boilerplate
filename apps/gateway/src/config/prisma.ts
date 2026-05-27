/**
 * Singleton PrismaClient for the gateway.
 * The Prisma schema lives at apps/api/prisma/schema.prisma.
 * During development, run `pnpm --filter @restopsiq/api prisma generate` to regenerate the client.
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logging';

declare global {
  // Prevent multiple instances in hot-reload (ts-node/tsx watch) scenarios
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

  client.$on('error' as never, (e: unknown) => {
    logger.error({ err: e }, 'Prisma error');
  });

  (client.$on as Function)('warn', (e: unknown) => {
    logger.warn({ event: e }, 'Prisma warning');
  });

  return client;
}

export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = createPrismaClient());

if (process.env['NODE_ENV'] !== 'production') {
  global.__prisma = prisma;
}
