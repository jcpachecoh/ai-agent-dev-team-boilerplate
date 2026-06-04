# Task 04 — Email Worker Core: processJob

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Tasks 01, 02, 03

---

## Goal

Create `email.worker.ts` with the BullMQ `Worker` that processes `email-queue` jobs. This task
covers the **happy path only**: rate limit check → use pre-rendered HTML → call
`ResendClient.sendEmail()` → save `resendMessageId`. Error classification and DLQ handling are
added in Tasks 05 and 06.

---

## Scope

### Create `packages/email/src/email.worker.ts`

**Exported class: `EmailWorker`**

```typescript
export class EmailWorker {
  private readonly worker: Worker<EmailJobPayload>;
  private readonly resendClient: ResendClient;
  private readonly redis: Redis;

  constructor(config: EmailWorkerConfig) { ... }

  close(): Promise<void> { ... }
}
```

**Constructor:**

- Creates a `Worker<EmailJobPayload>` pointing to `EMAIL_WORKER_CONFIG.queueName`.
- Sets `concurrency: EMAIL_WORKER_CONFIG.concurrency`.
- Passes `this.processJob` as the processor function.
- Creates a `ResendClient` with `config.resendApiKey`.
- Creates an ioredis client with `config.redisUrl` for rate limiting.

**`processJob(job)` (private, bound method):**

1. Check if `URGENT_TEMPLATE_TYPES` includes `job.data.options.template.type`.
   - If NOT urgent → call `checkRateLimit(redis, tenantId, job.id)`.
   - If rate limited → throw a retryable error.
2. Use `job.data.renderedHtml` directly (already rendered by `EmailService`).
3. Call `resendClient.sendEmail({ from, to, subject, html, attachments })`.
4. Call `job.updateData({ ...job.data, resendMessageId: result.id })`.
5. Return `{ resendMessageId: result.id }`.

**`close()` method:**

- Calls `worker.close()` and `redis.quit()`.

### Create `packages/email/src/test/email.worker.spec.ts` (happy path only)

| Test                                          | Description                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| Successful send                               | `sendEmail` called once; `job.updateData` called with `resendMessageId` |
| Rate limit check skipped for `reset-password` | `checkRateLimit` not called                                             |
| Rate limit check skipped for `verify-email`   | `checkRateLimit` not called                                             |
| Rate limit check called for `welcome`         | `checkRateLimit` called with `tenantId`                                 |
| Rate limit exceeded                           | Throws retryable error                                                  |
| Uses `renderedHtml` from payload              | Does not call `renderAsync` or `renderTemplateElement`                  |

**Mock approach:**

- `jest.mock('bullmq')` — mock `Worker` constructor; capture the processor function.
- `jest.mock('../email.rate-limit')` — mock `checkRateLimit`.
- `jest.spyOn(ResendClient.prototype, 'sendEmail')`.
- Pass a mock ioredis client.

---

## Out of Scope

- Error classification (4xx/5xx/429) — Task 05.
- DLQ handling — Task 06.
- Redis `email:failed` event — Task 07.
- Priority field in BullMQ job options — Task 08.
- `index.ts` export — Task 09.

---

## Files Allowed

| File                                           | Action |
| ---------------------------------------------- | ------ |
| `packages/email/src/email.worker.ts`           | Create |
| `packages/email/src/test/email.worker.spec.ts` | Create |

## Files Forbidden

- `packages/email/src/email.service.ts`
- `packages/email/src/email.queue.ts`
- `packages/email/src/email.dlq.ts`
- `packages/email/src/email.events.ts`
- `packages/email/src/index.ts`
- `packages/email/src/types.ts`
- `package.json`
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `EmailWorker` constructor accepts `EmailWorkerConfig`.
- [ ] `processJob` uses `renderedHtml` from payload without re-rendering.
- [ ] `resendMessageId` is saved via `job.updateData`.
- [ ] Rate limit is skipped for urgent template types.
- [ ] All happy-path worker tests pass.
- [ ] Typecheck passes with zero errors.

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.worker
pnpm --filter=@restopsiq/email test
```
