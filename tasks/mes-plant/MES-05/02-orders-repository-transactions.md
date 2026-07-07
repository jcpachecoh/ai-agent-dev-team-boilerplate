# MES-05 Task 02 — Orders Repository & Transactions

## Goal

Implement Prisma data access for production orders and phase executions, including the atomic create-order transaction.

**Depends on:** Task 01.

---

## Scope

- Extend `apps/api/src/mes/plant/repository/plant.repository.ts`.
- Implement `createOrderWithExecutionsTx` in a single `$transaction`.
- List/detail/update queries with tenant scoping.

---

## Out of Scope

- Business rules or HTTP exceptions.
- PhaseChainService logic.
- Controller, tests (task 09).

---

## Files allowed

- `apps/api/src/mes/plant/repository/plant.repository.ts` — extend

---

## Files forbidden

- `apps/api/src/mes/auth/**`
- `apps/api/src/mes/plant/service/**`
- `apps/api/src/mes/plant/controller/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Rules

- Inject `PrismaService` only.
- Never throw HTTP exceptions.
- Return `null` when not found.
- All queries include `tenantId`.

### `createOrderWithExecutionsTx`

Single `$transaction`:

1. `productionOrder.create` (`status: DRAFT`, fields from caller).
2. Load phases for `recipeId` ordered by `order ASC`.
3. For each phase: `phaseExecution.create` with `status: PENDING`, `workStationId`, `plannedMinutes: standardMinutes * batchCount`.
4. Return order + executions.

**Invariant:** `executions.length === phases.length`.

### `findOrderDetailById`

Include executions (with phase order, requiresQA), open operator sessions (`endedAt: null`), recipe summary.

### Active execution guard

Keep MES-05-00 query: `status: { not: COMPLETED }`, direct `workStationId`.

---

## Acceptance criteria

- [ ] All task 01 repository methods implemented.
- [ ] Create transaction produces one execution per recipe phase, all `PENDING`.
- [ ] No HTTP exceptions in repository.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
node scripts/validate-structure.js
```
