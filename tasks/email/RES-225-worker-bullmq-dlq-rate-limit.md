# RES-225 — BullMQ Email Worker with Exponential Retry, Dead Letter Queue and Tenant Rate Limiting

**Linear:** RES-225  
**Epic:** RES-221 — Email Module  
**Status:** Pending  
**Priority:** Urgent  
**Depends on:** RES-222, RES-223, RES-224

---

## Goal

Implement the BullMQ email worker that consumes jobs from `email-queue`, renders HTML with React
Email, delivers them through Resend, and handles failures intelligently:

- Exponential backoff for transient errors (5xx, network).
- No retry for permanent errors (4xx bounces, invalid addresses).
- Extended backoff for Resend rate limiting (429).
- Dead Letter Queue after 3 failures, with Redis event `email:failed`.
- Per-tenant sliding window rate limit of 100 emails/hour.
- URGENT priority for `reset-password` and `verify-email` — exempt from the rate limit.

---

## Background

`EmailService.send()` (from RES-223) enqueues a `EmailJobPayload` into BullMQ and returns a
`jobId` immediately. The HTTP request path never contacts Resend. This ticket implements the
worker process that drains the queue.

`ResendClient` (from RES-223) already maps Resend SDK error codes to `statusCode` numbers,
which enables intelligent retry decisions without parsing raw error messages.

---

## Scope

### New files

| File                                               | Purpose                                            |
| -------------------------------------------------- | -------------------------------------------------- |
| `packages/email/src/email.worker.ts`               | BullMQ Worker — processes jobs, calls ResendClient |
| `packages/email/src/email.worker.config.ts`        | Typed constants for queue/worker config            |
| `packages/email/src/email.rate-limit.ts`           | Redis sliding window rate limiter                  |
| `packages/email/src/email.dlq.ts`                  | Dead Letter Queue handler                          |
| `packages/email/src/email.events.ts`               | Redis event publisher for `email:failed`           |
| `packages/email/src/test/email.worker.spec.ts`     | Worker unit tests                                  |
| `packages/email/src/test/email.rate-limit.spec.ts` | Rate limiter unit tests                            |
| `packages/email/src/test/email.dlq.spec.ts`        | DLQ + event tests                                  |

### Modified files

| File                                | Change                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `packages/email/src/email.queue.ts` | Rename queue from `'email'` to `'email-queue'`; update `defaultJobOptions`      |
| `packages/email/src/types.ts`       | Add `metadata`, `resendMessageId`, `priority` fields; add new config interfaces |
| `packages/email/src/index.ts`       | Export new public symbols (worker, DLQ, rate limiter, events)                   |

---

## Out of Scope

- No Slack/webhook notification for DLQ (future ticket).
- No dashboard or UI for the DLQ.
- No multi-provider fallback (Resend is the only provider).
- No changes to `apps/api` or `apps/testlab`.
- No changes to template files.
- No changes to `pnpm-lock.yaml` unless a new dependency is strictly required.

---

## Queue Config

```typescript
// packages/email/src/email.worker.config.ts
export const EMAIL_WORKER_CONFIG = {
  queueName: 'email-queue', // aligns EMAIL_QUEUE_NAME constant
  concurrency: 10,
  dlqName: 'email-dlq',
  rateLimitWindowSeconds: 3600,
  rateLimitMaxPerTenant: 100,
} as const;

export const EMAIL_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { age: 86_400 * 3 }, // 3 days
  removeOnFail: false, // keep for DLQ inspection
} as const;

// Priority values (lower = higher priority in BullMQ)
export const JOB_PRIORITY = {
  URGENT: 1,
  NORMAL: 10,
} as const;

// Template types that bypass rate limit and get URGENT priority
export const URGENT_TEMPLATE_TYPES = new Set(['reset-password', 'verify-email']);
```

---

## Job Payload Contract

Current shape (from `types.ts`):

```typescript
interface EmailJobPayload {
  options: SendEmailOptions; // contains tenantId, to, subject, template, renderedHtml
  renderedHtml: string;
}
```

Required additions to `types.ts`:

```typescript
// On SendEmailOptions
priority?: 'normal' | 'urgent';
metadata?: Record<string, string>;

// On EmailJobPayload
resendMessageId?: string;   // written by worker after successful send

// New interfaces
interface EmailWorkerConfig {
  redisUrl: string;
  resendApiKey: string;
  fromAddress: string;
}

interface EmailFailedEvent {
  jobId: string;
  tenantId: string;
  templateType: string;
  errorCode: string;
  errorMessage: string;
  attempts: number;
  timestamp: string; // ISO 8601
}

interface TenantRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (ms) when the window resets
}
```

---

## Worker Processing Flow

```
Job received
  │
  ├─ Is template type in URGENT_TEMPLATE_TYPES?
  │     YES → skip rate limit check
  │     NO  → checkRateLimit(tenantId)
  │               allowed: false → throw RateLimitExceededError (retryable)
  │
  ├─ HTML already rendered (renderedHtml in payload) → use it directly
  │   (re-render only if renderedHtml is missing, for forward compatibility)
  │
  ├─ ResendClient.sendEmail({ from, to, subject, html, attachments })
  │
  ├─ SUCCESS → update job data with resendMessageId → done
  │
  └─ FAILURE (ResendError)
        statusCode === 429 → throw with extended delay hint (handled in onFailed)
        statusCode 4xx (!= 429) → job.moveToFailed(error, token, true) — no retry
        statusCode 5xx / network → throw normally → BullMQ retries with backoff
```

---

## Retry Strategy

| Error type                 | statusCode | BullMQ action                                 |
| -------------------------- | ---------- | --------------------------------------------- |
| Network / timeout          | N/A        | Normal retry (exponential, `delay: 5_000`)    |
| Resend server error        | 5xx        | Normal retry (exponential)                    |
| Resend rate limit          | 429        | Retry with multiplied delay (`delay * 4`)     |
| Invalid address / bounce   | 4xx ≠ 429  | `moveToFailed` immediately — no retry         |
| Tenant rate limit exceeded | —          | Retry (the window will clear within the hour) |

Max attempts: **3**. After 3 failures the job is moved to DLQ by the `onFailed` handler.

---

## Error Classification Strategy

Decision logic lives in `email.worker.ts` inside the `processJob` function:

```typescript
function classifyResendError(err: ResendError): 'no-retry' | 'rate-limit' | 'retryable' {
  if (err.statusCode === 429) return 'rate-limit';
  if (err.statusCode >= 400 && err.statusCode < 500) return 'no-retry';
  return 'retryable';
}
```

The worker catches `ResendError`, calls `classifyResendError`, and acts accordingly.
Non-`ResendError` exceptions (network, unexpected) are always retryable.

---

## DLQ Strategy

- Queue name: `email-dlq` (separate BullMQ Queue, not a failed-jobs list).
- `email.dlq.ts` exports `moveToDeadLetter(job, error)`:
  - Adds the original job payload + error info to `email-dlq`.
  - DLQ jobs use `removeOnFail: { age: 7 * 86400 }` (7 days).
- `moveToDeadLetter` is called from the worker's `onFailed` handler when
  `job.attemptsMade >= EMAIL_JOB_OPTIONS.attempts`.

---

## Redis Event Strategy

- `email.events.ts` exports `publishEmailFailedEvent(redis, event: EmailFailedEvent)`.
- Uses `redis.publish('email:failed', JSON.stringify(event))`.
- Called immediately after `moveToDeadLetter` succeeds.
- The Redis client used for pub/sub is a **separate connection** from BullMQ's connection
  (BullMQ blocks its connection during queue operations — mixing pub/sub would deadlock).

---

## Tenant Rate Limit Strategy

Implementation in `email.rate-limit.ts`:

- **Algorithm:** Redis sorted set sliding window.
  - Key: `ratelimit:email:{tenantId}`
  - Each allowed email adds a member `{jobId}:{timestamp}` with score = `Date.now()`.
  - On each check: `ZREMRANGEBYSCORE` entries older than `now - windowMs`, then `ZCARD`.
  - Atomic via Lua script: remove-expired + count + conditionally add — single round-trip.
- **Exempt types:** `reset-password`, `verify-email` — checked before calling `checkRateLimit`.
- **TTL:** Key TTL set to `windowSeconds + 60` on every write to prevent memory leaks.

```typescript
// Lua script (pseudo):
// local now = tonumber(ARGV[1])
// local window = tonumber(ARGV[2])
// local max = tonumber(ARGV[3])
// local key = KEYS[1]
// redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
// local count = redis.call('ZCARD', key)
// if count >= max then return {0, 0} end
// redis.call('ZADD', key, now, ARGV[4])
// redis.call('EXPIRE', key, window / 1000 + 60)
// return {1, max - count - 1}
```

---

## Auth Email Priority Strategy

When `EmailService.send()` is called with a `reset-password` or `verify-email` template:

- The job is added with `priority: JOB_PRIORITY.URGENT` (value `1` in BullMQ).
- BullMQ processes lower-number priority jobs first.
- The worker skips the rate limit check for these job types.
- `SendEmailOptions.priority` field carries this intent; the service maps it to BullMQ's
  `JobsOptions.priority`.

---

## Testing Strategy

### General approach (consistent with existing specs)

- `jest.mock('bullmq')` at file top before imports for all specs touching BullMQ.
- `jest.mock('ioredis')` or pass a mock Redis client to rate limiter / event publisher.
- `jest.spyOn(ResendClient.prototype, 'sendEmail')` for worker tests.
- No real Redis, no real Resend calls, no network.

### `email.worker.spec.ts`

| Test                      | Assertion                                                          |
| ------------------------- | ------------------------------------------------------------------ |
| Successful job            | `sendEmail` called once; `resendMessageId` saved in job data       |
| Error 429                 | Job not discarded; BullMQ allowed to retry                         |
| Error 4xx bounce          | `job.moveToFailed` called with `noRetry: true`                     |
| Error 5xx                 | Exception re-thrown; BullMQ retries                                |
| `attemptsMade === 3`      | `moveToDeadLetter` + `publishEmailFailedEvent` called              |
| `reset-password` template | Rate limit check skipped                                           |
| `verify-email` template   | Rate limit check skipped                                           |
| Rate limit exceeded       | Job throws retryable error; rate limit NOT called for urgent types |

### `email.rate-limit.spec.ts`

| Test                    | Assertion                                      |
| ----------------------- | ---------------------------------------------- |
| First email             | `allowed: true`, `remaining: 99`               |
| 100th email             | `allowed: true`, `remaining: 0`                |
| 101st email             | `allowed: false`                               |
| Expired entries removed | Window slide works correctly (mock `Date.now`) |
| `reset-password`        | `allowed: true` without incrementing counter   |

### `email.dlq.spec.ts`

| Test                      | Assertion                                                              |
| ------------------------- | ---------------------------------------------------------------------- |
| `moveToDeadLetter`        | Calls `dlqQueue.add` with original payload + error info                |
| `publishEmailFailedEvent` | Calls `redis.publish` with `'email:failed'` + valid JSON               |
| Event shape               | Contains `jobId`, `tenantId`, `templateType`, `errorCode`, `timestamp` |

---

## Acceptance Criteria

- [ ] Network failures retry with exponential backoff (3 attempts, delay starting at 5s).
- [ ] Invalid/bounced email (4xx) does not retry.
- [ ] After 3 failures, job is added to `email-dlq` and `email:failed` event is published.
- [ ] Tenant rate limit of 100 emails/hour enforced via Redis sliding window.
- [ ] `reset-password` and `verify-email` always bypass rate limit.
- [ ] `reset-password` and `verify-email` jobs are enqueued with BullMQ priority `1`.
- [ ] `resendMessageId` is saved into the job's data after a successful send.
- [ ] All new files pass `typecheck` and `test`.
- [ ] No changes to template files, `apps/api`, or `apps/testlab`.

---

## Risks and Follow-Ups

| Risk                                     | Mitigation                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ioredis` not directly in `package.json` | Verify BullMQ exports its Redis client; if not, add `ioredis` to dependencies in Task 01 |
| `job.moveToFailed` API in BullMQ v5      | Confirm method signature before Task 05; fallback to `job.discard()` if renamed          |
| DLQ accumulation                         | DLQ jobs use 7-day TTL (`removeOnFail: { age: 7 * 86400 }`)                              |
| Pub/sub + BullMQ connection conflict     | Use a dedicated Redis connection for `email.events.ts`                                   |
| Rate limit Lua atomicity                 | Lua scripts are atomic in Redis; use `EVAL` not pipeline                                 |

---

## Validation Commands

```bash
# Typecheck
pnpm --filter=@restopsiq/email typecheck

# Full test suite
pnpm --filter=@restopsiq/email test

# Worker tests only
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.worker

# Rate limiter tests only
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.rate-limit

# DLQ tests only
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.dlq

# Build
pnpm build --filter=@restopsiq/email

# Structure validation
node scripts/validate-structure.js
```
