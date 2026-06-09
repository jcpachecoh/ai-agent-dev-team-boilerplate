import { checkRateLimit } from '../email.rate-limit';
import type { TenantRateLimitResult } from '../types';

// ---------------------------------------------------------------------------
// Mock Redis client
// ---------------------------------------------------------------------------

function makeRedis(evalReturn: [number, number]) {
  return { eval: jest.fn().mockResolvedValue(evalReturn) };
}

const TENANT = 'tenant-abc';
const JOB_ID = 'job-001';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkRateLimit', () => {
  describe('first email (empty window)', () => {
    it('returns allowed: true and remaining: 99', async () => {
      const redis = makeRedis([1, 99]);
      const result: TenantRateLimitResult = await checkRateLimit(redis as never, TENANT, JOB_ID);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });
  });

  describe('100th email (window at limit)', () => {
    it('returns allowed: true and remaining: 0', async () => {
      const redis = makeRedis([1, 0]);
      const result = await checkRateLimit(redis as never, TENANT, JOB_ID);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe('101st email (window exceeded)', () => {
    it('returns allowed: false and remaining: 0', async () => {
      const redis = makeRedis([0, 0]);
      const result = await checkRateLimit(redis as never, TENANT, JOB_ID);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Redis eval arguments', () => {
    it('calls redis.eval exactly once per check', async () => {
      const redis = makeRedis([1, 50]);
      await checkRateLimit(redis as never, TENANT, JOB_ID);
      expect(redis.eval).toHaveBeenCalledTimes(1);
    });

    it('uses the tenant-specific key as KEYS[1]', async () => {
      const redis = makeRedis([1, 99]);
      await checkRateLimit(redis as never, 'my-tenant', JOB_ID);

      const call = redis.eval.mock.calls[0];
      expect(call[2]).toBe('ratelimit:email:my-tenant');
    });

    it('passes windowMs as 3_600_000 by default (1 hour)', async () => {
      const redis = makeRedis([1, 99]);
      await checkRateLimit(redis as never, TENANT, JOB_ID);

      const call = redis.eval.mock.calls[0];
      // ARGV[2] = windowMs at index 4 in the eval signature (script, numkeys, key, argv1, argv2, …)
      expect(call[4]).toBe('3600000');
    });

    it('passes max as 100 by default', async () => {
      const redis = makeRedis([1, 99]);
      await checkRateLimit(redis as never, TENANT, JOB_ID);

      const call = redis.eval.mock.calls[0];
      // ARGV[3] = max at index 5
      expect(call[5]).toBe('100');
    });

    it('passes TTL as windowSeconds + 60 (3660)', async () => {
      const redis = makeRedis([1, 99]);
      await checkRateLimit(redis as never, TENANT, JOB_ID);

      const call = redis.eval.mock.calls[0];
      // ARGV[5] = ttlSeconds at index 7
      expect(call[7]).toBe('3660');
    });

    it('includes jobId in the member ARGV', async () => {
      const redis = makeRedis([1, 99]);
      await checkRateLimit(redis as never, TENANT, 'job-xyz');

      const call = redis.eval.mock.calls[0];
      // ARGV[4] = member at index 6
      expect(call[6] as string).toContain('job-xyz');
    });
  });

  describe('resetAt', () => {
    it('returns resetAt within the next hour', async () => {
      const redis = makeRedis([1, 99]);
      const before = Date.now();
      const result = await checkRateLimit(redis as never, TENANT, JOB_ID);
      const after = Date.now();

      expect(result.resetAt).toBeGreaterThanOrEqual(before + 3_600_000);
      expect(result.resetAt).toBeLessThanOrEqual(after + 3_600_000 + 5);
    });

    it('returns resetAt when rate limit is exceeded', async () => {
      const redis = makeRedis([0, 0]);
      const result = await checkRateLimit(redis as never, TENANT, JOB_ID);

      expect(typeof result.resetAt).toBe('number');
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });
  });

  describe('custom config', () => {
    it('respects custom maxPerHour', async () => {
      const redis = makeRedis([1, 9]);
      const result = await checkRateLimit(redis as never, TENANT, JOB_ID, { maxPerHour: 10 });

      // Remaining comes from mock; check that custom max was forwarded
      const call = redis.eval.mock.calls[0];
      expect(call[5]).toBe('10');
      expect(result.remaining).toBe(9);
    });

    it('respects custom windowSeconds', async () => {
      const redis = makeRedis([1, 99]);
      await checkRateLimit(redis as never, TENANT, JOB_ID, { windowSeconds: 1800 });

      const call = redis.eval.mock.calls[0];
      expect(call[4]).toBe('1800000'); // windowMs = 1800 * 1000
      expect(call[7]).toBe('1860'); // ttl = 1800 + 60
    });
  });

  describe('URGENT_TEMPLATE_TYPES exemption (caller responsibility)', () => {
    it('rate limiter itself does not inspect template type — allowed is entirely determined by Redis response', async () => {
      // Simulate calling rate limiter for a reset-password job — the caller
      // (worker, Task 04) is responsible for NOT calling checkRateLimit.
      // Here we verify the rate limiter is a pure Redis client with no template awareness.
      const redis = makeRedis([1, 99]);
      const result = await checkRateLimit(redis as never, TENANT, 'reset-pw-job-id');

      // Rate limiter always defers to Redis result — no internal template check
      expect(result.allowed).toBe(true);
      expect(redis.eval).toHaveBeenCalledTimes(1);
    });
  });
});
