# MES-05 Task 05 — PhaseChainService (Internal Complete)

## Goal

Implement `PhaseChainService` with an **internal** method to complete a phase execution and advance the recipe chain. No HTTP route in MES-05.

**Depends on:** Tasks 01–02.

---

## Scope

- Create `apps/api/src/mes/plant/service/phase-chain.service.ts`.
- Implement `completeExecution(...)` (internal API).
- Register provider in `plant.module.ts`.
- Unit-test chain behavior directly against service (task 09).

---

## Out of Scope

- `POST /api/plant/phases/complete` or any completion HTTP endpoint.
- QA approve route (task 06 — may share service helpers).
- WebSocket emit (task 07 — optional callback interface).
- Schema changes.

---

## Files allowed

- `apps/api/src/mes/plant/service/phase-chain.service.ts` — create
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend with `IPhaseChainService`
- `apps/api/src/mes/plant/plant.module.ts` — register provider only

---

## Files forbidden

- `apps/api/src/mes/plant/controller/plant.controller.ts` (no complete route)
- `apps/api/src/mes/auth/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `postman/**`

---

## Implementation notes

### Internal method signature (example)

```typescript
completeExecution(
  tenantId: string,
  executionId: string,
  input: { producedQuantity?; actualMinutes?; notes? },
): Promise<{ orderId; changedExecutions: Array<{ id; status; workStationId; phaseId }> }>
```

### Flow

1. Load execution E with phase (order K, requiresQA) and order.
2. Validate completable state (e.g. `IN_PROCESS`); order not `CANCELLED`.
3. Set E → `COMPLETED`, `completedAt`.
4. Find next execution N (phase order K+1).
5. If none: complete order when all executions terminal.
6. If N exists:
   - Prior `requiresQA === false` → N → **`READY`**
   - Prior `requiresQA === true` → N → **`QA_PENDING`**
7. Return changed executions for WS layer (task 07).

### Future ticket

Operator/runtime module will call this method or a thin wrapper when HTTP complete is added.

---

## Acceptance criteria

- [ ] Service exists and is injectable.
- [ ] No controller route for phase completion.
- [ ] Unit tests (task 09) cover READY and QA_PENDING paths.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=phase-chain
node scripts/validate-structure.js
```
