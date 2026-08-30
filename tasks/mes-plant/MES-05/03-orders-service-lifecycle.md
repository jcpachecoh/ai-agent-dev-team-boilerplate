# MES-05 Task 03 — Orders Service Lifecycle

## Goal

Implement business rules for production order create, list, detail, plan, pause, resume, and cancel.

**Depends on:** Tasks 01–02, 08 (cancel policy).

---

## Scope

- Extend `apps/api/src/mes/plant/service/plant.service.ts` (or add `orders.service.ts` registered in module).
- Order number generation, state transitions, cancel validation.

---

## Out of Scope

- PhaseChainService (task 05).
- QA approve HTTP (task 06).
- Controller routes (task 04).
- WebSocket emits (task 07).
- Schema changes.

---

## Files allowed

- `apps/api/src/mes/plant/service/plant.service.ts` — extend
- `apps/api/src/mes/plant/service/orders.service.ts` — create (optional split)

---

## Files forbidden

- `apps/api/src/mes/auth/**` (logic changes)
- `apps/api/src/mes/plant/controller/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `postman/**`

---

## Implementation notes

### Create order

1. Validate active recipe for tenant.
2. Validate batch count and planned dates.
3. Generate order `number` (service-level seq per tenant/year).
4. Set `recipeVersion`, `unit`, `plannedQuantity = batchCount * batchSize`.
5. Call `createOrderWithExecutionsTx`; assert N executions all `PENDING`.

### Plan (`DRAFT` → `PLANNED`)

- Reject invalid states.
- Promote execution for phase `order === 1`: `PENDING` → `READY`.
- Return updated detail.

### Pause / resume

- Pause: require `reason`; from `IN_PROCESS`; order → `PAUSED`; affected executions → `PAUSED`.
- Resume: from `PAUSED` → `IN_PROCESS`; restore execution states.

### Cancel

- Require `reason` always.
- If `IN_PROCESS` or `PAUSED`: require `consumedInputsAction` (task 08).
- Order → `CANCELLED`; persist cancel metadata in `notes` JSON.
- Block further chain transitions on cancelled orders.

### Exceptions

`NotFoundException`, `BadRequestException`, `ConflictException` for invalid transitions.

---

## Acceptance criteria

- [ ] 5-phase recipe → 5 `PENDING` executions on create.
- [ ] Plan promotes only first phase to `READY`.
- [ ] Cancel `IN_PROCESS` without `consumedInputsAction` → 400.
- [ ] Tenant safety on all operations.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant.service
node scripts/validate-structure.js
```
