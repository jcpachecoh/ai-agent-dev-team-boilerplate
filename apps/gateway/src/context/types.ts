import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { Logger } from 'pino';
import type { AuthKind, AuthUser, GlobalUser, OperationalContextUser } from '../auth/types';
import { DataLoaders } from './dataLoaders';
import { Services } from '../services/types';

/**
 * Full GraphQL context injected into every resolver.
 * Matches SDD section 8.1.
 */
export interface GraphQLContext {
  /** Which auth token type is active, if any */
  authKind: AuthKind;
  /** Global User session (email/password JWT) */
  globalUser: GlobalUser | null;
  /** OperationalUser session (cédula/PIN JWT) */
  operationalUser: OperationalContextUser | null;
  /** Legacy operational alias — null when authKind is global */
  user: AuthUser | null;
  /** Tenant ID from operational JWT, or null for global/anonymous */
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
  redis: Redis | null;
  /** BullMQ email queue */
  bullQueue: Queue | null;
  /** Per-request DataLoaders */
  loaders: DataLoaders;
  /** Service layer instances */
  services: Services;
  /** Child logger tagged with requestId */
  log: Logger;
  /** True when any supported auth token is present */
  isAuthenticated: boolean;
  /** True when a global User JWT is present */
  isGlobalAuthenticated: boolean;
  /** True when an operational MES JWT is present */
  isOperationalAuthenticated: boolean;
}
