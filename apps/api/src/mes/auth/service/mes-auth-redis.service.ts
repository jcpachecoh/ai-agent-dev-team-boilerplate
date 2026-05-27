import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

@Injectable()
export class MesAuthRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MesAuthRedisService.name);
  private redis!: Redis;
  private redisReady = false;
  private redisErrorLogged = false;

  onModuleInit(): void {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
    });

    this.redis.on('ready', () => {
      this.redisReady = true;
      this.logger.log(`Redis ready for mes-auth at ${redisUrl}`);
    });

    this.redis.on('error', (err: Error) => {
      this.redisReady = false;
      if (!this.redisErrorLogged) {
        this.redisErrorLogged = true;
        this.logger.warn(`Redis unavailable for mes-auth (${err.message})`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private failOpenRateLimit(): RateLimitResult {
    const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_SECONDS * 1000);
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS, resetAt };
  }

  private shouldFailOpenWithoutRedis(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.MES_AUTH_REDIS_OPTIONAL === 'true';
  }

  async checkRateLimit(ip: string): Promise<RateLimitResult> {
    if (!this.redisReady && this.shouldFailOpenWithoutRedis()) {
      return this.failOpenRateLimit();
    }

    const key = `mes:auth:rate-limit:${ip}`;
    let count: number;
    try {
      count = await this.redis.incr(key);
    } catch (err) {
      if (this.shouldFailOpenWithoutRedis()) {
        return this.failOpenRateLimit();
      }
      throw err;
    }

    if (count === 1) {
      await this.redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }

    const ttl = await this.redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);
    const remaining = Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - count);
    const allowed = count <= RATE_LIMIT_MAX_ATTEMPTS;

    return { allowed, remaining, resetAt };
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (!this.redisReady && this.shouldFailOpenWithoutRedis()) {
      return;
    }

    try {
      await this.redis.set(`mes:auth:blacklist:${jti}`, '1', 'EX', ttlSeconds);
    } catch (err) {
      if (this.shouldFailOpenWithoutRedis()) {
        this.logger.warn(
          `Skipping token blacklist for jti (Redis unavailable): ${err instanceof Error ? err.message : String(err)}`,
        );
        return;
      }
      throw err;
    }
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (!this.redisReady && this.shouldFailOpenWithoutRedis()) {
      return false;
    }

    try {
      const result = await this.redis.exists(`mes:auth:blacklist:${jti}`);
      return result === 1;
    } catch (err) {
      if (this.shouldFailOpenWithoutRedis()) {
        return false;
      }
      throw err;
    }
  }
}
