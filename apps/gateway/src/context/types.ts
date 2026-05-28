import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { Logger } from 'pino';
import { AuthUser } from '../auth/types';
import { DataLoaders } from './dataLoaders';
import { Services } from '../services/types';

/**
 * Full GraphQL context injected into every resolver.
 * Matches SDD section 8.1.
 */
export interface GraphQLContext {
  /** Authenticated user, or null for anonymous requests */
  user: AuthUser | null;
  /** Tenant ID derived from the authenticated user */
  tenantId: string | null;
  /** Raw Express request object */
  request: Request;
  /** Client IP address */
  ip: string;
  /** Unique request identifier (UUID) */
  requestId: string;
  /** High-resolution start time (Date.now()) */
  startTime: number;
  /** Prisma client singleton */
  prisma: PrismaClient;
  /** Redis client singleton */
  redis: Redis;
  /** BullMQ email queue */
  bullQueue: Queue;
  /** Per-request DataLoaders */
  loaders: DataLoaders;
  /** Service layer instances */
  services: Services;
  /** Child logger tagged with requestId */
  log: Logger;
  /** Convenience flag */
  isAuthenticated: boolean;
}
