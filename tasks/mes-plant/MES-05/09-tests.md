# MES-05 Task 09 — Unit Tests

## Goal

Add unit test coverage for orders lifecycle, internal phase chain, QA approve, and WebSocket emission.

**Depends on:** Tasks 03–07.

---

## Scope

- Extend/create specs under `apps/api/src/mes/plant/test/`.
- Cover epic acceptance scenarios.

---

## Out of Scope

- E2E against real DB.
- Postman (task 10).
- Complete-phase HTTP tests (route must not exist).

---

## Files allowed

- `apps/api/src/mes/plant/test/plant.service.spec.ts` — extend
- `apps/api/src/mes/plant/test/plant.controller.spec.ts` — extend
- `apps/api/src/mes/plant/test/phase-chain.service.spec.ts` — create
- `apps/api/src/mes/plant/test/plant.gateway.spec.ts` — create (optional)
- `apps/api/src/mes/plant/test/plant.repository.spec.ts` — extend

---

## Files forbidden

- `apps/api/src/mes/auth/test/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `postman/**`

---

## Implementation notes

### Orders service

| Scenario          | Expected                                    |
| ----------------- | ------------------------------------------- |
| Create            | N phases → N `PENDING` executions           |
| Plan              | First execution `READY`                     |
| Cancel IN_PROCESS | Missing `consumedInputsAction` → BadRequest |

### PhaseChainService (internal)

| Scenario                   | Expected                    |
| -------------------------- | --------------------------- |
| Complete; prior no QA      | Next → `READY`              |
| Complete; prior requiresQA | Next → `QA_PENDING`         |
| QA approve                 | Next `QA_PENDING` → `READY` |
| Last phase complete        | Order → `COMPLETED`         |

Invoke `completeExecution` directly — no HTTP.

### Controller

- Order routes delegate with JWT `tenantId`.
- QA approve route supervisor-only.
- Assert **no** handler for `phases/complete`.

### Gateway

- Emit called with `phase:status_changed` payload shape.

### Coverage

`pnpm --filter=@restopsiq/api run test:cov` ≥ 80% branches/functions.

---

## Acceptance criteria

- [ ] Chain scenarios covered via internal service API.
- [ ] Cancel validation covered.
- [ ] No test expects complete-phase HTTP route.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=plant` passes.
- [ ] `test:cov` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
pnpm --filter=@restopsiq/api run test:cov
pnpm --filter=@restopsiq/api typecheck
node scripts/validate-structure.js
```
