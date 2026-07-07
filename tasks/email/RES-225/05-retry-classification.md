# Task 05 — Retry Classification (4xx / 429 / 5xx)

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Task 04

---

## Goal

Extend `email.worker.ts` with intelligent error classification so the worker can distinguish
between permanent failures (4xx bounces), Resend rate limiting (429), and transient errors
(5xx / network). Only retryable errors should be re-thrown for BullMQ backoff; permanent
errors must be failed immediately without consuming retry attempts.

---

## Scope

### Modify `packages/email/src/email.worker.ts`

Add a `classifyResendError` helper (pure function, exportable for testing):

```typescript
export type RetryClass = 'no-retry' | 'rate-limit' | 'retryable';

export function classifyResendError(err: ResendError): RetryClass {
  if (err.statusCode === 429) return 'rate-limit';
  if (err.statusCode >= 400 && err.statusCode < 500) return 'no-retry';
  return 'retryable';
}
```

Extend `processJob` to catch `ResendError` and act based on the classification:

```typescript
try {
  // ... sendEmail ...
} catch (err) {
  if (err instanceof ResendError) {
    const cls = classifyResendError(err);
    if (cls === 'no-retry') {
      // Fail immediately — do not consume remaining attempts
      await job.moveToFailed(err, token, true);
      return;
    }
    if (cls === 'rate-limit') {
      // Re-throw — BullMQ will apply backoff.
      // Optionally multiply the delay for this specific attempt.
      throw err;
    }
    // 'retryable' — re-throw for normal exponential backoff
    throw err;
  }
  // Non-ResendError (network, unexpected) — always retryable
  throw err;
}
```

> **Note on BullMQ v5 API:** Confirm that `job.moveToFailed(error, token, true)` is the correct
> signature. The third boolean argument `ignoreLock` may differ. Verify before implementing.

### Modify `packages/email/src/test/email.worker.spec.ts`

Add error-path tests:

| Test                       | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `ResendError` 4xx          | `job.moveToFailed` called with `ignoreLock: true`; no re-throw |
| `ResendError` 429          | Error re-thrown; `job.moveToFailed` not called                 |
| `ResendError` 5xx          | Error re-thrown; `job.moveToFailed` not called                 |
| Non-`ResendError` network  | Error re-thrown; `job.moveToFailed` not called                 |
| `classifyResendError(429)` | Returns `'rate-limit'`                                         |
| `classifyResendError(422)` | Returns `'no-retry'`                                           |
| `classifyResendError(500)` | Returns `'retryable'`                                          |

---

## Out of Scope

- DLQ handling after 3 failures — Task 06.
- Redis `email:failed` event — Task 07.
- BullMQ priority — Task 08.

---

## Files Allowed

| File                                           | Action                                                  |
| ---------------------------------------------- | ------------------------------------------------------- |
| `packages/email/src/email.worker.ts`           | Modify — add `classifyResendError`, extend `processJob` |
| `packages/email/src/test/email.worker.spec.ts` | Modify — add error-path tests                           |

## Files Forbidden

- `packages/email/src/email.service.ts`
- `packages/email/src/email.dlq.ts`
- `packages/email/src/email.events.ts`
- `packages/email/src/index.ts`
- `packages/email/src/types.ts`
- `packages/email/src/email.queue.ts`
- `package.json`
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `classifyResendError` is exported and unit-tested directly.
- [ ] 4xx errors call `job.moveToFailed` and do not re-throw.
- [ ] 429 and 5xx errors re-throw for BullMQ to handle retries.
- [ ] Non-`ResendError` exceptions always re-throw.
- [ ] All worker tests (happy path + error path) pass.
- [ ] Typecheck passes with zero errors.

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.worker
pnpm --filter=@restopsiq/email test
```
