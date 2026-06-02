import crypto from 'crypto';
import { Queue } from 'bullmq';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { resolveAuthSession } from '../auth/auth.guard';
import { UserRole } from '../auth/types';
import { env } from '../config/env';
import { createDataLoaders } from './dataLoaders';
import { createServices } from '../services/types';
import { createChildLogger } from '../utils/logging';
import { GraphQLContext } from './types';
import type { Request } from 'express';

// Lazy-init BullMQ queue (avoids Redis connection at module load in tests)
let emailQueue: Queue | null = null;

function getEmailQueue(): Queue | null {
  if (!redis) return null;
  if (!emailQueue) {
    emailQueue = new Queue('email', {
      connection: { url: env.REDIS_URL! },
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

  let session = resolveAuthSession(req);

  if (!session.isAuthenticated && env.graphqlAuthDisabled) {
    const bypassOperational = {
      id: 'dev-auth-bypass',
      tenantId: env.graphqlDevTenantId,
      role: UserRole.OWNER,
    };
    session = {
      authKind: 'operational',
      globalUser: null,
      operationalUser: bypassOperational,
      user: bypassOperational,
      isAuthenticated: true,
      tenantId: env.graphqlDevTenantId,
    };
  }

  const log = createChildLogger('request').child({ requestId, ip });

  const bullQueue = getEmailQueue();
  const loaders = createDataLoaders(prisma);

  const services = createServices({ prisma, redis, log });

  return {
    authKind: session.authKind,
    globalUser: session.globalUser,
    operationalUser: session.operationalUser,
    user: session.user,
    tenantId: session.tenantId,
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
    isAuthenticated: session.isAuthenticated,
    isGlobalAuthenticated: session.authKind === 'global',
    isOperationalAuthenticated: session.authKind === 'operational',
  };
}
