# MES-02 Task 01 — Interfaces

## Goal

Define TypeScript contracts for the plant module: `IPlantRepository`, `IPlantService`, and domain types for nested recipe creation, reorder, and recipe detail with `totalStandardMinutes`.

**Depends on:** MES-01 schema (Prisma client generated).

---

## Scope

- Create `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` only.

---

## Out of Scope

- Repository, service, controller, DTO, or module implementation.
- Tests (optional type-only compile check via typecheck).
- Changes to `mes/auth` or `supplyitems` interfaces.

---

## Files allowed

- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — create

---

## Files forbidden

- `apps/api/src/mes/auth/**` (except reading patterns)
- `apps/api/src/supplyitems/**`
- `apps/api/prisma/schema.prisma`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Implementation notes

### Repository interface (sketch)

Include methods for:

**Workstations:** `findAllWorkStations`, `findWorkStationById`, `createWorkStation`, `updateWorkStation`, `softDeleteWorkStation`, `hasActiveExecutionsForWorkStation`

**Recipes:** `findAllRecipes`, `findRecipeById`, `findActiveRecipeByName`, `createRecipeWithPhasesTx`, `updateRecipe`, `softDeleteRecipe`, `cloneRecipeTx`, `findRecipeDetailById` (with phases + inputs)

**Phases:** `reorderPhasesTx`, `findPhaseById`, `findPhasesByRecipeId`

**Inputs:** `createPhaseInput`, `deletePhaseInput`, `findPhaseInputById`

All queries must accept `tenantId` where applicable. Repository returns `null` for missing rows; no HTTP exceptions.

### Service interface (sketch)

Mirror epic endpoints; every method takes `tenantId: string` as first argument (from JWT in controller).

### Domain types

- `CreateRecipeWithPhasesInput` — recipe fields + `phases[]` with nested `inputs[]`
- `ReorderPhaseItem` — `{ phaseId: string; newOrder: number }`
- `RecipeDetailResponse` — recipe + `phases` (with `inputs`) + `totalStandardMinutes: number`

Use Prisma types (`WorkStation`, `ProductionRecipe`, etc.) where appropriate.

### Design decisions

- `totalStandardMinutes` is computed in the **service** when mapping detail response, not stored in DB.
- DTOs in task 06 may mirror these types; interfaces should not import from `controller/dto/` to avoid circular deps (service can use interface types; DTOs implement or map to them).

---

## Acceptance criteria

- [ ] `IPlantRepository` exported with workstation, recipe, phase, and input methods.
- [ ] `IPlantService` exported with methods matching all epic routes.
- [ ] `RecipeDetailResponse` (or equivalent) includes `totalStandardMinutes`.
- [ ] `CreateRecipeWithPhasesInput` supports nested phases and inputs.
- [ ] `ReorderPhaseItem` type exported.
- [ ] No classes or decorators in interfaces file.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
