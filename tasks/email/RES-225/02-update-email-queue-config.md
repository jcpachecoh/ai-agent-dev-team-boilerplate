# Task 02 — Update Email Queue Config and EmailService Job Options

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Task 01

---

## Goal

Update `email.queue.ts` and `email.service.ts` to align the queue name and default job options
with the RES-225 specification. This task has no new files — only targeted edits to two
existing files.

---

## Scope

### Modify `packages/email/src/email.queue.ts`

Change `EMAIL_QUEUE_NAME` from `'email'` to `'email-queue'`:

```typescript
// Before
export const EMAIL_QUEUE_NAME = 'email' as const;

// After
export const EMAIL_QUEUE_NAME = 'email-queue' as const;
```

### Modify `packages/email/src/email.service.ts`

Replace the inline `defaultJobOptions` object with a reference to `EMAIL_JOB_OPTIONS` from
`email.worker.config.ts`:

```typescript
// Import addition
import { EMAIL_JOB_OPTIONS } from './email.worker.config';

// Replace defaultJobOptions in Queue constructor
defaultJobOptions: EMAIL_JOB_OPTIONS,
```

The net effect on the options:

| Field              | Before           | After                 |
| ------------------ | ---------------- | --------------------- |
| `backoff.delay`    | `1_000`          | `5_000`               |
| `removeOnComplete` | `{ count: 100 }` | `{ age: 86_400 * 3 }` |
| `removeOnFail`     | `{ count: 500 }` | `false`               |
| `attempts`         | `3`              | `3` (unchanged)       |

---

## Out of Scope

- Do not create `email.worker.ts`.
- Do not modify `types.ts`.
- Do not modify `index.ts`.
- Do not touch any test files.
- Do not install dependencies.

---

## Files Allowed

| File                                  | Action                                       |
| ------------------------------------- | -------------------------------------------- |
| `packages/email/src/email.queue.ts`   | Modify — rename queue constant               |
| `packages/email/src/email.service.ts` | Modify — use `EMAIL_JOB_OPTIONS` from config |

## Files Forbidden

- `packages/email/src/email.worker.ts`
- `packages/email/src/types.ts`
- `packages/email/src/index.ts`
- `packages/email/src/test/*`
- `package.json`
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `EMAIL_QUEUE_NAME` equals `'email-queue'`.
- [ ] `EmailService` uses `EMAIL_JOB_OPTIONS` from `email.worker.config.ts`.
- [ ] `backoff.delay` is `5_000`.
- [ ] `removeOnComplete` is `{ age: 86_400 * 3 }`.
- [ ] `removeOnFail` is `false`.
- [ ] All existing tests still pass (they mock BullMQ, so the queue name change is transparent).
- [ ] Typecheck passes with zero errors.

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test
```
