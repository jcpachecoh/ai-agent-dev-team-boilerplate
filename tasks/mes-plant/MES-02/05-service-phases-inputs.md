# MES-02 Task 05 — Service: Phases Reorder & Phase Inputs

## Goal

Implement phase reorder and phase input add/remove with supply catalog validation.

**Depends on:** Tasks 01–02, 04 (recipe/phase lookup patterns).

---

## Scope

- Methods in `plant.service.ts`:
  - `reorderPhases(recipeId, items: ReorderPhaseItem[])`
  - `addPhaseInput(phaseId, input)`
  - `removePhaseInput(phaseId, inputId)`

---

## Out of Scope

- Workstation and recipe CRUD (tasks 03–04).
- Controller, DTOs, module wiring, tests.

---

## Files allowed

- `apps/api/src/mes/plant/service/plant.service.ts` — extend

---

## Files forbidden

- `apps/api/src/mes/auth/**` (no edits)
- `apps/api/src/supplyitems/**` (no edits to supply-items module)
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Inject

- `PlantRepository`
- `SupplyItemsService` from `SupplyItemsModule` (already exports service)

### `reorderPhases`

1. Load recipe by `tenantId` + `recipeId` → `NotFoundException`.
2. Load all phases for recipe.
3. Validate every `phaseId` in body belongs to recipe and tenant.
4. Validate `newOrder` values are unique and cover exactly the phase set (e.g. 1..n).
5. `reorderPhasesTx` — updates **only** `order` field; does not touch `workStationId` or inputs.

### `addPhaseInput`

1. Load phase by `tenantId` + `phaseId` → `NotFoundException`.
2. `supplyItemsService.findOne(tenantId, supplyItemId)` — reuses existing tenant-scoped catalog check.
3. `createPhaseInput` via repository.

### `removePhaseInput`

1. Load phase; verify input exists and `phaseId` + `tenantId` match.
2. `deletePhaseInput` via repository.

---

## Acceptance criteria

- [ ] Reorder preserves workstation and input links (order-only updates).
- [ ] Invalid `phaseId` in reorder body → `BadRequestException` or `NotFoundException`.
- [ ] `addPhaseInput` validates supply via `SupplyItemsService.findOne(tenantId, supplyItemId)`.
- [ ] `removePhaseInput` is tenant-safe.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
