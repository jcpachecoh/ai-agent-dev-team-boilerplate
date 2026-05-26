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

  onModuleInit(): void {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.logger.log(`Redis connected for mes-auth at ${redisUrl}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  async checkRateLimit(ip: string): Promise<RateLimitResult> {
    const key = `mes:auth:rate-limit:${ip}`;
    const count = await this.redis.incr(key);

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
    await this.redis.set(`mes:auth:blacklist:${jti}`, '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.exists(`mes:auth:blacklist:${jti}`);
    return result === 1;
  }
}
