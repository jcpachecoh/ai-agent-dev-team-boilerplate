# MES-02 Task 04 — Service: Recipes

## Goal

Implement production recipe business logic: nested create with versioning, list, detail with `totalStandardMinutes`, patch, clone, and soft delete.

**Depends on:** Tasks 01–02; task 03 optional (no hard dependency).

---

## Scope

- Recipe methods in `plant.service.ts`:
  - `createRecipe` (nested phases + inputs)
  - `findAllRecipes`
  - `findRecipeById` (detail)
  - `updateRecipe`
  - `cloneRecipe`
  - `softDeleteRecipe`

---

## Out of Scope

- Phase reorder and phase input endpoints (task 05).
- Controller, DTOs, tests, module wiring.
- Schema changes.

---

## Files allowed

- `apps/api/src/mes/plant/service/plant.service.ts` — extend (recipe methods only)

---

## Files forbidden

- `apps/api/src/mes/auth/**` (no edits)
- `apps/api/src/supplyitems/**` (no edits; may inject `SupplyItemsService` in task 05 only for inputs — for create recipe, validate inputs in task 04 or 05: **validate nested inputs in createRecipe here** using `SupplyItemsService.findOne` per input)
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Versioning on create

1. `findActiveRecipeByName(tenantId, name)` where `isActive: true`.
2. If found:
   - Pass id to repository tx to deactivate old recipe.
   - `version = existing.version + 1`.
3. Else `version = 1`.
4. Call `createRecipeWithPhasesTx` once.

### Pre-transaction validation (service)

- At least one phase (if required by product — document assumption: allow zero phases or require ≥1 per ticket; **default: allow empty phases array** unless ticket implies otherwise).
- Unique `order` values within payload.
- Each `workStationId`: exists, same tenant, `isActive: true`.
- Each nested `supplyItemId`: `await supplyItemsService.findOne(tenantId, id)` (throws → propagates as 404).
- `minOperators <= maxOperators`.
- `batchSize` / quantities valid decimals.

### `findRecipeById` (detail)

- Load via `findRecipeDetailById`.
- Compute `totalStandardMinutes = phases.reduce((sum, p) => sum + p.standardMinutes, 0)`.
- Return `RecipeDetailResponse` shape from interfaces.

### `updateRecipe`

- Patch recipe metadata only (not full graph replace unless ticket specifies — **metadata only**: name, finishedProductId, batchSize, batchUnit, estimatedMinutes, notes, etc.).
- If renaming to active duplicate name, apply versioning rules or reject — **follow create versioning** if name changes to conflict with another active recipe.

### `cloneRecipe`

- Load source detail; `NotFoundException` if missing.
- `cloneRecipeTx` with new name strategy: e.g. `"${name} (copia)"` or same name + versioning — document chosen behavior in code comment.
- Return new recipe id or detail.

### `softDeleteRecipe`

- `isActive: false`; do not delete phases (historical orders may reference recipe).

---

## Acceptance criteria

- [ ] `createRecipe` uses single repository transaction for recipe + phases + inputs.
- [ ] Active same-name recipe deactivated and version incremented on create.
- [ ] `findRecipeById` includes `totalStandardMinutes` = sum of `standardMinutes`.
- [ ] Nested supply items validated via `SupplyItemsService.findOne`.
- [ ] Clone copies all phases and inputs.
- [ ] Soft delete sets `isActive: false`.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
