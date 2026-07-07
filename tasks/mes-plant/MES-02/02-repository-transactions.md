# MES-02 Task 02 — Repository & Transactions

## Goal

Implement `PlantRepository` with Prisma data access and transactional helpers for nested recipe create, clone, and phase reorder.

**Depends on:** Task 01 (interfaces).

---

## Scope

- Create `apps/api/src/mes/plant/repository/plant.repository.ts`.
- Implement `IPlantRepository`.
- Use `prisma.$transaction` for: `createRecipeWithPhasesTx`, `cloneRecipeTx`, `reorderPhasesTx`.
- Implement `hasActiveExecutionsForWorkStation` query.

---

## Out of Scope

- Service business rules or HTTP exceptions.
- Controller, DTOs, module wiring.
- Supply item validation (service layer).
- Tests (task 09).

---

## Files allowed

- `apps/api/src/mes/plant/repository/plant.repository.ts` — create

---

## Files forbidden

- `apps/api/src/mes/auth/**`
- `apps/api/src/supplyitems/**`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Rules

- Inject `PrismaService` only.
- **Never** throw `NotFoundException`, `BadRequestException`, etc.
- Return `null` when entity not found.
- All `find*` by id include `tenantId` in `where`.

### `createRecipeWithPhasesTx`

Single `$transaction`:

1. If caller passes `deactivateRecipeId` (optional), `update` that recipe `isActive: false`.
2. `productionRecipe.create` with nested data or sequential creates.
3. For each phase: `productionPhase.create` with `recipeId`, `workStationId`, `order`, etc.
4. For each input: `phaseInput.create` with `phaseId`, `supplyItemId`, etc.

Return created recipe id or full graph per interface.

### `cloneRecipeTx`

Load source recipe with phases + inputs; create new recipe + copies in one transaction.

### `reorderPhasesTx`

For each `{ phaseId, newOrder }`: `productionPhase.update({ where: { id, recipeId, tenantId }, data: { order: newOrder } })` inside `$transaction`.

### `hasActiveExecutionsForWorkStation`

```typescript
phaseExecution.findFirst({
  where: {
    tenantId,
    completedAt: null,
    startedAt: { not: null },
    phase: { workStationId },
  },
});
```

Return `boolean` (`!!result`).

### `findRecipeDetailById`

`productionRecipe.findFirst` with `include: { phases: { orderBy: { order: 'asc' }, include: { inputs: true } } }`.

---

## Acceptance criteria

- [ ] `PlantRepository` implements `IPlantRepository`.
- [ ] Nested recipe create uses exactly one `$transaction`.
- [ ] Clone uses one `$transaction`.
- [ ] Reorder uses one `$transaction` and updates only `order`.
- [ ] `hasActiveExecutionsForWorkStation` matches active execution definition in main spec.
- [ ] No HTTP exceptions in repository.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
