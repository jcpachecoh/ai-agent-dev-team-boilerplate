import crypto from 'crypto';
import { Queue } from 'bullmq';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { authenticate } from '../auth/auth.guard';
import { UserRole } from '../auth/types';
import { env } from '../config/env';
import { createDataLoaders } from './dataLoaders';
import { createServices } from '../services/types';
import { createChildLogger, logger } from '../utils/logging';
import { GraphQLContext } from './types';
import type { Request } from 'express';

// Lazy-init BullMQ queue (avoids Redis connection at module load in tests)
let emailQueue: Queue | null = null;

function getEmailQueue(): Queue {
  if (!emailQueue) {
    emailQueue = new Queue('email', {
      connection: redis,
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    });
  }
  return emailQueue;
}

/**
 * Apollo Server context factory.
 * Called once per request; creates per-request DataLoaders and service instances.
 */
export async function createContext({ req }: { req: Request }): Promise<GraphQLContext> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown';

  let user = authenticate(req);
  if (!user && env.graphqlAuthDisabled) {
    user = {
      id: 'dev-auth-bypass',
      tenantId: env.graphqlDevTenantId,
      role: UserRole.OWNER,
    };
  }
  const isAuthenticated = user !== null;
  const tenantId = user?.tenantId ?? null;

  const log = createChildLogger('request').child({ requestId, ip });

  const bullQueue = getEmailQueue();
  const loaders = createDataLoaders(prisma);

  const services = createServices({ prisma, redis, log });

  return {
    user,
    tenantId,
    request: req,
    ip,
    requestId,
    startTime,
    prisma,
    redis,
    bullQueue,
    loaders,
    services,
    log,
    isAuthenticated,
  };
}
