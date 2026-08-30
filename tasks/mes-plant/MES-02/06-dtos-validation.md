# MES-02 Task 06 — DTOs & Validation

## Goal

Create request/response DTOs with `class-validator` and Swagger decorators for all plant endpoints.

**Depends on:** Task 01 (interface shapes).

---

## Scope

- Create DTOs under `apps/api/src/mes/plant/controller/dto/`:
  - `create-workstation.dto.ts`
  - `update-workstation.dto.ts`
  - `create-recipe.dto.ts` (nested phases + inputs)
  - `update-recipe.dto.ts`
  - `reorder-phases.dto.ts`
  - `create-phase-input.dto.ts`
  - `recipe-detail.response.ts` (or response DTOs as needed)

---

## Out of Scope

- Controller route wiring (task 07).
- Service/repository logic changes beyond type alignment.
- Tests (task 09).

---

## Files allowed

- `apps/api/src/mes/plant/controller/dto/*.ts` — create

---

## Files forbidden

- `apps/api/src/mes/auth/**`
- `apps/api/src/supplyitems/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `plant.controller.ts` (task 07)

---

## Implementation notes

### Nested create recipe DTO

- Use `@ValidateNested()` + `@Type(() => CreatePhaseDto)` for phases array.
- Each phase: `order`, `name`, `workStationId`, `standardMinutes`, optional `description`, `minOperators`, `maxOperators`, `requiresQA`, nested `inputs[]`.
- Each input: `supplyItemId`, `quantityPerBatch`, `unit` (enum `StockUnit`), `isOptional`.

### Reorder DTO

- Array of `{ phaseId: string, newOrder: number }` with `@IsArray`, `@ValidateNested`.

### Conventions

- Match `supplyitems` DTO style: `@ApiProperty`, `@IsString`, `@IsInt`, `@Min`, etc.
- Do not include `tenantId` in any request body.
- Response DTO for recipe detail must expose `totalStandardMinutes: number`.

---

## Acceptance criteria

- [ ] All request bodies for epic routes have DTOs with validation decorators.
- [ ] Nested recipe DTO validates phases and inputs structure.
- [ ] `StockUnit` enum used for `batchUnit` and input `unit`.
- [ ] No `tenantId` in request DTOs.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
