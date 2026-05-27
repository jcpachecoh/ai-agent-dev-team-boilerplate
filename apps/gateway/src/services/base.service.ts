import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Logger } from 'pino';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../utils/constants';

export interface PaginationOptions {
  limit?: number | null;
  offset?: number | null;
}

export interface PaginationResult {
  take: number;
  skip: number;
}

export class BaseService {
  protected readonly prisma: PrismaClient;
  protected readonly redis: Redis;
  protected readonly log: Logger;

  constructor(prisma: PrismaClient, redis: Redis, log: Logger) {
    this.prisma = prisma;
    this.redis = redis;
    this.log = log;
  }

  /**
   * Normalise pagination options, clamping to MAX_PAGE_SIZE.
   */
  protected paginate(opts: PaginationOptions): PaginationResult {
    const take = Math.min(Math.max(1, opts.limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = Math.max(0, opts.offset ?? 0);
    return { take, skip };
  }
}
