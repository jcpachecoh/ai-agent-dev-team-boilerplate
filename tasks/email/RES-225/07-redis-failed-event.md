# Task 07 — Redis email:failed Event Publisher

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Tasks 01, 06

---

## Goal

Create `email.events.ts` with the `publishEmailFailedEvent` function, and wire it into the
worker's `onFailed` handler immediately after `moveToDeadLetter`. The event must be published
over a **dedicated** Redis connection to avoid conflict with BullMQ's blocking connection.

---

## Scope

### Create `packages/email/src/email.events.ts`

**Exported function:**

```typescript
export async function publishEmailFailedEvent(redis: Redis, event: EmailFailedEvent): Promise<void>;
```

**Behaviour:**

- Calls `redis.publish('email:failed', JSON.stringify(event))`.
- If `redis.publish` throws, log and swallow (the DLQ write already succeeded).

**Event shape** (from `EmailFailedEvent` in `types.ts`):

```typescript
{
  jobId: string;
  tenantId: string;
  templateType: string;
  errorCode: string;
  errorMessage: string;
  attempts: number;
  timestamp: string; // ISO 8601
}
```

### Modify `packages/email/src/email.worker.ts`

- Add a second ioredis client `pubRedis` for pub/sub (separate from the rate-limit `redis`).
- In `onFailed`, after `moveToDeadLetter` succeeds:

```typescript
await publishEmailFailedEvent(this.pubRedis, {
  jobId: job.id ?? 'unknown',
  tenantId: job.data.options.tenantId,
  templateType: job.data.options.template.type,
  errorCode: err instanceof ResendError ? err.code : 'unknown',
  errorMessage: err.message,
  attempts: job.attemptsMade,
  timestamp: new Date().toISOString(),
});
```

- Add `pubRedis.quit()` to the `close()` method.

### Modify `packages/email/src/test/email.dlq.spec.ts`

Add tests for the event publisher (or create a separate section):

| Test                                            | Description                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `publishEmailFailedEvent` calls `redis.publish` | Called with channel `'email:failed'`                                                      |
| Published payload is valid JSON                 | `JSON.parse` succeeds                                                                     |
| Payload contains all required fields            | `jobId`, `tenantId`, `templateType`, `errorCode`, `errorMessage`, `attempts`, `timestamp` |
| `timestamp` is ISO 8601                         | Parseable by `new Date()`                                                                 |
| Publish error is swallowed                      | Does not throw if `redis.publish` rejects                                                 |

### Modify `packages/email/src/test/email.worker.spec.ts`

Add `onFailed` test:

| Test                                             | Description                                               |
| ------------------------------------------------ | --------------------------------------------------------- |
| `onFailed` after max attempts                    | `publishEmailFailedEvent` called after `moveToDeadLetter` |
| `onFailed` after max attempts with `ResendError` | `errorCode` matches `ResendError.code`                    |

---

## Out of Scope

- Slack/webhook integration — future ticket.
- Subscribing to `email:failed` — not part of this package.
- BullMQ priority — Task 08.

---

## Files Allowed

| File                                           | Action                                      |
| ---------------------------------------------- | ------------------------------------------- |
| `packages/email/src/email.events.ts`           | Create                                      |
| `packages/email/src/email.worker.ts`           | Modify — add `pubRedis`, wire event publish |
| `packages/email/src/test/email.dlq.spec.ts`    | Modify — add event publisher tests          |
| `packages/email/src/test/email.worker.spec.ts` | Modify — add `onFailed` + event tests       |

## Files Forbidden

- `packages/email/src/email.service.ts`
- `packages/email/src/email.queue.ts`
- `packages/email/src/email.dlq.ts`
- `packages/email/src/index.ts`
- `packages/email/src/types.ts`
- `package.json`
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `publishEmailFailedEvent` publishes to the `'email:failed'` Redis channel.
- [ ] Published payload is valid JSON matching the `EmailFailedEvent` interface.
- [ ] The event pub/sub Redis connection is separate from the rate-limit connection.
- [ ] Publish errors are swallowed — DLQ write is not rolled back.
- [ ] All event tests pass.
- [ ] Typecheck passes with zero errors.

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.dlq
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.worker
pnpm --filter=@restopsiq/email test
```
