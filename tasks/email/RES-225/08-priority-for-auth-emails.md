# Task 08 — URGENT Priority for Auth Emails

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Tasks 01, 02

---

## Goal

Make `EmailService.send()` automatically assign BullMQ priority `1` (URGENT) to
`reset-password` and `verify-email` jobs, and priority `10` (NORMAL) to all others.
Consumers may also pass `priority: 'urgent'` on `SendEmailOptions` to override for any
template type.

---

## Scope

### Modify `packages/email/src/email.service.ts`

In the `send()` method, derive the BullMQ `priority` value before calling `queue.add`:

```typescript
import { JOB_PRIORITY, URGENT_TEMPLATE_TYPES } from './email.worker.config';

// Inside send():
const isUrgent = URGENT_TEMPLATE_TYPES.has(options.template.type) || options.priority === 'urgent';
const priority = isUrgent ? JOB_PRIORITY.URGENT : JOB_PRIORITY.NORMAL;

const job = await this.queue.add(EMAIL_JOB_NAME, payload, { priority });
```

### Modify `packages/email/src/test/email.service.spec.ts`

Add priority tests:

| Test                                         | Description                                |
| -------------------------------------------- | ------------------------------------------ |
| `reset-password` enqueued with priority `1`  | `queue.add` called with `{ priority: 1 }`  |
| `verify-email` enqueued with priority `1`    | `queue.add` called with `{ priority: 1 }`  |
| `welcome` enqueued with priority `10`        | `queue.add` called with `{ priority: 10 }` |
| `invite-user` enqueued with priority `10`    | `queue.add` called with `{ priority: 10 }` |
| `options.priority === 'urgent'` on `welcome` | Job enqueued with priority `1`             |

---

## Out of Scope

- Do not modify the worker — priority is a BullMQ scheduler concern, not a processor concern.
- Do not modify `index.ts` yet — Task 09.
- Do not modify template files.

---

## Files Allowed

| File                                            | Action                                           |
| ----------------------------------------------- | ------------------------------------------------ |
| `packages/email/src/email.service.ts`           | Modify — derive and pass priority to `queue.add` |
| `packages/email/src/test/email.service.spec.ts` | Modify — add priority tests                      |

## Files Forbidden

- `packages/email/src/email.worker.ts`
- `packages/email/src/email.dlq.ts`
- `packages/email/src/email.events.ts`
- `packages/email/src/email.queue.ts`
- `packages/email/src/index.ts`
- `packages/email/src/types.ts`
- `package.json`
- `pnpm-lock.yaml`
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] `reset-password` and `verify-email` jobs are always enqueued with priority `1`.
- [ ] All other template jobs are enqueued with priority `10` by default.
- [ ] `options.priority === 'urgent'` overrides to priority `1` for any template type.
- [ ] All service tests (existing + new priority tests) pass.
- [ ] Typecheck passes with zero errors.

---

## Validation Commands

```bash
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.service
pnpm --filter=@restopsiq/email test
```
