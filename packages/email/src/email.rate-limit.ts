import type { Redis } from 'ioredis';

import { EMAIL_WORKER_CONFIG } from './email.worker.config';
import type { TenantRateLimitResult } from './types';

// ---------------------------------------------------------------------------
// Lua sliding-window script
//
// KEYS[1]  — the sorted-set key  (ratelimit:email:{tenantId})
// ARGV[1]  — now in milliseconds
// ARGV[2]  — window duration in milliseconds
// ARGV[3]  — max allowed sends per window
// ARGV[4]  — unique member (jobId:now)
// ARGV[5]  — key TTL in seconds (windowSeconds + 60 guard)
//
// Returns a two-element array: [allowed (0|1), remaining]
// ---------------------------------------------------------------------------
const RATE_LIMIT_LUA = `
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local max      = tonumber(ARGV[3])
local member   = ARGV[4]
local ttl      = tonumber(ARGV[5])

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
local count = redis.call('ZCARD', key)

if count >= max then
  return {0, 0}
end

redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, ttl)
return {1, max - count - 1}
`;

export async function checkRateLimit(
  redis: Redis,
  tenantId: string,
  jobId: string,
  config?: { maxPerHour?: number; windowSeconds?: number },
): Promise<TenantRateLimitResult> {
  const max = config?.maxPerHour ?? EMAIL_WORKER_CONFIG.rateLimitMaxPerTenant;
  const windowSeconds = config?.windowSeconds ?? EMAIL_WORKER_CONFIG.rateLimitWindowSeconds;
  const windowMs = windowSeconds * 1000;
  const ttlSeconds = windowSeconds + 60;

  const now = Date.now();
  const key = `ratelimit:email:${tenantId}`;
  const member = `${jobId}:${now}`;
  const resetAt = now + windowMs;

  const result = (await redis.eval(
    RATE_LIMIT_LUA,
    1,
    key,
    String(now),
    String(windowMs),
    String(max),
    member,
    String(ttlSeconds),
  )) as [number, number];

  const allowed = result[0] === 1;
  const remaining = result[1] ?? 0;

  return { allowed, remaining, resetAt };
}
