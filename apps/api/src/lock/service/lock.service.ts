import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  InternalServerErrorException,
} from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

import { ILock, ILockService } from '../interfaces/lock.interfaces';

@Injectable()
export class LockService implements ILockService, OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;
  private redlock!: Redlock;

  onModuleInit(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.redlock = new Redlock([this.redisClient as any], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  async acquireLock(resource: string, ttlMs: number): Promise<ILock> {
    try {
      const lock = await this.redlock.lock(resource, ttlMs);
      return {
        release: () => lock.unlock(),
      };
    } catch (error) {
      throw new InternalServerErrorException(`Could not acquire lock for resource: ${resource}`);
    }
  }

  async usingLock<T>(resource: string, ttlMs: number, callback: () => Promise<T>): Promise<T> {
    const lock = await this.acquireLock(resource, ttlMs);
    try {
      return await callback();
    } finally {
      await lock.release();
    }
  }
}
