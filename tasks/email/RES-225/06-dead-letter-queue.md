# Task 06 — Dead Letter Queue Handler

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Tasks 01, 04

---

## Goal

Create `email.dlq.ts` which adds permanently-failed jobs to a separate `email-dlq` BullMQ queue,
preserving the original payload plus failure metadata for later inspection or replay. Wire the
DLQ into `email.worker.ts` via the `onFailed` event handler.

---

## Scope

### Create `packages/email/src/email.dlq.ts`

**Exported function:**

```typescript
export async function moveToDeadLetter(
  dlqQueue: Queue,
  job: Job<EmailJobPayload>,
  error: Error,
): Promise<void>;
```

**Behaviour:**

- Adds a job to `dlqQueue` (the `email-dlq` queue) with:
  - `name`: `'dead-letter'`
  - `data`: original `job.data` plus `dlqMeta: { jobId, failedAt, errorCode, errorMessage }`.
  - `opts`: `removeOnFail: { age: 7 * 86_400 }` (7-day TTL).
- Does **not** publish the Redis event (that is Task 07).
- Should not throw if the DLQ queue is unavailable — log the error and swallow it so the
  original job failure is still recorded.

### Modify `packages/email/src/email.worker.ts`

**Add `onFailed` listener in the constructor:**

```typescript
this.worker.on('failed', async (job, err) => {
  if (!job) return;
  if (job.attemptsMade >= EMAIL_JOB_OPTIONS.attempts) {
    await moveToDeadLetter(this.dlqQueue, job, err);
    // Task 07 will add publishEmailFailedEvent here
  }
});
```

**Add `dlqQueue` property:**

- `private readonly dlqQueue: Queue` — created in constructor pointing to
  `EMAIL_WORKER_CONFIG.dlqName`.

### Create `packages/email/src/test/email.dlq.spec.ts`

| Test                                        | Description                                      |
| ------------------------------------------- | ------------------------------------------------ |
| `moveToDeadLetter` calls `dlqQueue.add`     | Called once with correct job name and data shape |
| DLQ job data includes original payload      | `data.options` matches original job data         |
| DLQ job data includes `dlqMeta.jobId`       | Job ID is present                                |
| DLQ job data includes `dlqMeta.failedAt`    | ISO timestamp present                            |
| DLQ job data includes `dlqMeta.errorCode`   | Correct error code                               |
| DLQ options set 7-day TTL                   | `removeOnFail.age === 7 * 86_400`                |
| `moveToDeadLetter` swallows DLQ queue error | Does not throw if `dlqQueue.add` rejects         |

### Modify `packages/email/src/test/email.worker.spec.ts`

Add integration test for the `onFailed` handler:

| Test                                  | Description                   |
| ------------------------------------- | ----------------------------- |
| `onFailed` after `attemptsMade === 3` | `moveToDeadLetter` called     |
| `onFailed` after `attemptsMade < 3`   | `moveToDeadLetter` NOT called |

**Mock approach:** Mock `email.dlq.ts` module: `jest.mock('../email.dlq')`.

---

## Out of Scope

- Redis `email:failed` event — Task 07.
- BullMQ priority — Task 08.
- `index.ts` export — Task 09.

---

## Files Allowed

| File                                           | Action                                   |
| ---------------------------------------------- | ---------------------------------------- |
| `packages/email/src/email.dlq.ts`              | Create                                   |
| `packages/email/src/email.worker.ts`           | Modify — add `dlqQueue`, wire `onFailed` |
| `packages/email/src/test/email.dlq.spec.ts`    | Create                                   |
| `packages/email/src/test/email.worker.spec.ts` | Modify — add `onFailed` tests            |

## Files Forbidden

- `packages/email/src/email.events.ts`
- `packages/email/src/email.service.ts`
- `packages/email/src/email.queue.ts`
- `packages/email/src/index.ts`
- `packages/email/src/types.ts`
- `package.json`
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `moveToDeadLetter` adds the job to `email-dlq` with correct data shape and TTL.
- [ ] `onFailed` in the worker calls `moveToDeadLetter` only after the maximum attempts.
- [ ] DLQ errors are swallowed (the original failure is still recorded).
- [ ] All DLQ tests and updated worker tests pass.
- [ ] Typecheck passes with zero errors.

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.dlq
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.worker
pnpm --filter=@restopsiq/email test
```
