# Task 01 — Worker Config Constants and Type Additions

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** RES-224 (all tasks complete)

---

## Goal

Create `email.worker.config.ts` with all typed constants for the worker, and extend `types.ts`
with the new fields and interfaces required by the worker, rate limiter, DLQ, and event publisher.

This task has no runtime behaviour — it is purely types and constants. All downstream tasks
(02–09) depend on these definitions being in place first.

---

## Scope

### Create `packages/email/src/email.worker.config.ts`

Export the following constants:

```typescript
export const EMAIL_WORKER_CONFIG = {
  queueName: 'email-queue',
  concurrency: 10,
  dlqName: 'email-dlq',
  rateLimitWindowSeconds: 3600,
  rateLimitMaxPerTenant: 100,
} as const;

export const EMAIL_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { age: 86_400 * 3 },
  removeOnFail: false,
} as const;

export const JOB_PRIORITY = {
  URGENT: 1,
  NORMAL: 10,
} as const;

export const URGENT_TEMPLATE_TYPES = new Set<string>(['reset-password', 'verify-email']);
```

### Modify `packages/email/src/types.ts`

Add to `SendEmailOptions`:

```typescript
priority?: 'normal' | 'urgent';
metadata?: Record<string, string>;
```

Add to `EmailJobPayload`:

```typescript
resendMessageId?: string;
```

Add new interfaces:

```typescript
export interface EmailWorkerConfig {
  redisUrl: string;
  resendApiKey: string;
  fromAddress: string;
}

export interface EmailFailedEvent {
  jobId: string;
  tenantId: string;
  templateType: string;
  errorCode: string;
  errorMessage: string;
  attempts: number;
  timestamp: string;
}

export interface TenantRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}
```

---

## Out of Scope

- Do not create `email.worker.ts`.
- Do not create `email.rate-limit.ts`.
- Do not create `email.dlq.ts`.
- Do not create `email.events.ts`.
- Do not modify `email.service.ts`.
- Do not modify `email.queue.ts`.
- Do not modify `index.ts`.
- Do not install dependencies.

---

## Files Allowed

| File                                        | Action                                  |
| ------------------------------------------- | --------------------------------------- |
| `packages/email/src/email.worker.config.ts` | Create                                  |
| `packages/email/src/types.ts`               | Modify — add fields and interfaces only |

## Files Forbidden

- `packages/email/src/email.worker.ts`
- `packages/email/src/email.service.ts`
- `packages/email/src/email.queue.ts`
- `packages/email/src/index.ts`
- `packages/email/src/test/*`
- `package.json`
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `email.worker.config.ts` exports all four constants with correct types.
- [ ] `types.ts` compiles with zero errors.
- [ ] `SendEmailOptions.priority` and `SendEmailOptions.metadata` are optional.
- [ ] `EmailJobPayload.resendMessageId` is optional.
- [ ] `EmailWorkerConfig`, `EmailFailedEvent`, `TenantRateLimitResult` are exported.
- [ ] All existing tests still pass (no breaking changes to existing types).

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test
```
