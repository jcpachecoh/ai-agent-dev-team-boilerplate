# Task 09 — Final Worker Tests and Index Exports

**Parent:** RES-225  
**Status:** Pending  
**Depends on:** Tasks 01–08 (all complete)

---

## Goal

Close out RES-225 by:

1. Verifying the full test suite passes with all worker components integrated.
2. Exporting the new public symbols from `packages/email/src/index.ts`.
3. Confirming build and structure validation are clean.

This task does **not** implement new logic — it is a final integration and wiring step.

---

## Scope

### Modify `packages/email/src/index.ts`

Add exports for the new worker-related public symbols:

```typescript
// Worker
export { EmailWorker } from './email.worker';
export { classifyResendError } from './email.worker';
export type { RetryClass } from './email.worker';

// Worker config
export {
  EMAIL_WORKER_CONFIG,
  EMAIL_JOB_OPTIONS,
  JOB_PRIORITY,
  URGENT_TEMPLATE_TYPES,
} from './email.worker.config';

// Rate limiter
export { checkRateLimit } from './email.rate-limit';

// DLQ
export { moveToDeadLetter } from './email.dlq';

// Events
export { publishEmailFailedEvent } from './email.events';

// New types (from types.ts additions in Task 01)
// Add to existing type exports block:
//   EmailWorkerConfig, EmailFailedEvent, TenantRateLimitResult
```

### Run full validation

Confirm all of the following pass before marking Task 09 complete:

- `pnpm --filter=@restopsiq/email typecheck` — zero errors.
- `pnpm --filter=@restopsiq/email test` — all suites pass (7 existing + 3 new = 10 suites).
- `pnpm build --filter=@restopsiq/email` — build succeeds, `dist/index.js` includes new exports.
- `node -e "const e = require('./packages/email/dist/index.js'); console.log(Object.keys(e).sort())"` — confirm new symbols present.
- `node scripts/validate-structure.js` — exits 0.

---

## Out of Scope

- No new logic, components, or templates.
- Do not modify worker files (only `index.ts`).
- Do not modify `apps/api` or `apps/testlab`.

---

## Files Allowed

| File                          | Action                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `packages/email/src/index.ts` | Modify — add worker, config, DLQ, events, rate-limit exports |

## Files Forbidden

- `packages/email/src/email.worker.ts`
- `packages/email/src/email.service.ts`
- `packages/email/src/email.queue.ts`
- `packages/email/src/email.dlq.ts`
- `packages/email/src/email.events.ts`
- `packages/email/src/email.rate-limit.ts`
- `packages/email/src/types.ts`
- `package.json`
- `pnpm-lock.yaml`
- Any test file
- Any file in `apps/`

---

## Acceptance Criteria

- [ ] All 10 test suites pass.
- [ ] `EmailWorker`, `checkRateLimit`, `moveToDeadLetter`, `publishEmailFailedEvent`, and
      `classifyResendError` are present in `dist/index.js`.
- [ ] `EmailWorkerConfig`, `EmailFailedEvent`, `TenantRateLimitResult` are exported as types.
- [ ] Build artifact size is reasonable (no unexpected dependencies bundled).
- [ ] `validate-structure.js` exits 0.

---

## Validation Commands

```bash
# Typecheck
pnpm --filter=@restopsiq/email typecheck

# All tests
pnpm --filter=@restopsiq/email test

# Build
pnpm build --filter=@restopsiq/email

# Verify public exports
node -e "const e = require('./packages/email/dist/index.js'); console.log(Object.keys(e).sort())"

# Structure validation
node scripts/validate-structure.js
```
