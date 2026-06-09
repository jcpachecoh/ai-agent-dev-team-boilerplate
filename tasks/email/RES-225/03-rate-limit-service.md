# Task 03 — Tenant Rate Limit Service

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Task 01

---

## Goal

Create `email.rate-limit.ts` — a Redis sliding window rate limiter that enforces a maximum of
100 emails per hour per tenant. Auth templates (`reset-password`, `verify-email`) are exempt
and must never consume from the counter.

---

## Scope

### Create `packages/email/src/email.rate-limit.ts`

**Algorithm:** Redis sorted set sliding window, implemented with an atomic Lua script.

**Key format:** `ratelimit:email:{tenantId}`

**Exported function:**

```typescript
export async function checkRateLimit(
  redis: Redis, // ioredis client instance
  tenantId: string,
  jobId: string,
  config?: { maxPerHour?: number; windowSeconds?: number },
): Promise<TenantRateLimitResult>;
```

**Lua script logic (one atomic round-trip):**

1. `ZREMRANGEBYSCORE key -inf (now - windowMs)` — remove expired entries.
2. `ZCARD key` — count remaining entries in window.
3. If count >= max → return `{ allowed: false, remaining: 0, resetAt }`.
4. `ZADD key now "{jobId}:{now}"` — record this job.
5. `EXPIRE key windowSeconds + 60` — prevent memory leak.
6. Return `{ allowed: true, remaining: max - count - 1, resetAt }`.

**URGENT_TEMPLATE_TYPES exemption:** The caller (worker) is responsible for skipping
`checkRateLimit` when the template type is in `URGENT_TEMPLATE_TYPES`. The rate limiter itself
has no knowledge of template types.

### Create `packages/email/src/test/email.rate-limit.spec.ts`

Minimum tests:

| Test                    | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| First email             | `allowed: true`, `remaining: 99`                         |
| 100th email             | `allowed: true`, `remaining: 0`                          |
| 101st email             | `allowed: false`, `remaining: 0`                         |
| Expired entries removed | Entries outside window are not counted (mock `Date.now`) |
| Key TTL set             | Lua script calls `EXPIRE` with correct TTL               |
| Returns `resetAt`       | Timestamp in milliseconds, within the next hour          |

**Mock approach:** Pass a mock ioredis client whose `eval` method is mocked with `jest.fn()`.
Return values should simulate the Lua script output. No real Redis connection.

---

## Out of Scope

- Do not create `email.worker.ts`.
- Do not modify `email.service.ts` or `email.queue.ts`.
- Do not modify `index.ts`.
- Do not handle template-type exemption inside the rate limiter (that is the worker's job).
- Do not install `ioredis` without checking if BullMQ already exposes it.

---

## Files Allowed

| File                                               | Action |
| -------------------------------------------------- | ------ |
| `packages/email/src/email.rate-limit.ts`           | Create |
| `packages/email/src/test/email.rate-limit.spec.ts` | Create |

## Files Forbidden

- `packages/email/src/email.worker.ts`
- `packages/email/src/email.service.ts`
- `packages/email/src/email.queue.ts`
- `packages/email/src/index.ts`
- `packages/email/src/types.ts`
- `package.json` (unless `ioredis` is confirmed missing; document the gap before modifying)
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `checkRateLimit` returns `TenantRateLimitResult`.
- [ ] Lua script is atomic (single `eval` call).
- [ ] Default config uses `rateLimitMaxPerTenant: 100` and `rateLimitWindowSeconds: 3600` from `EMAIL_WORKER_CONFIG`.
- [ ] All rate limiter tests pass.
- [ ] Typecheck passes with zero errors.

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.rate-limit
pnpm --filter=@restopsiq/email test
```
