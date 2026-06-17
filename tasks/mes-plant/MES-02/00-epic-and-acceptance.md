# MES-02 Task 00 — Epic & Acceptance Checklist

## Goal

Track epic-level progress and acceptance criteria for the plant master data REST API. No implementation in this task.

---

## Scope

- Checklist only; references `../MES-02-rest-api-plant-masters.md`.

---

## Out of Scope

- Any code changes.

---

## Files allowed

- `tasks/mes-plant/MES-02/00-epic-and-acceptance.md` (this file)

---

## Files forbidden

- Everything under `apps/api/src/`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

Use this checklist when closing the epic:

### Workstations

- [x] POST `/api/plant/workstations` — create with tenant from JWT
- [x] GET `/api/plant/workstations` — list by tenant
- [x] PATCH `/api/plant/workstations/:id` — update fields
- [x] DELETE `/api/plant/workstations/:id` — soft delete; blocked if active executions

### Recipes

- [x] POST `/api/plant/recipes` — nested create in one transaction
- [x] GET `/api/plant/recipes` — list
- [x] GET `/api/plant/recipes/:id` — detail + `totalStandardMinutes`
- [x] PATCH `/api/plant/recipes/:id` — update metadata
- [x] POST `/api/plant/recipes/:id/clone` — full copy
- [x] DELETE `/api/plant/recipes/:id` — soft delete
- [x] Versioning when active same-name recipe exists

### Phases & inputs

- [x] PATCH `/api/plant/recipes/:id/phases/reorder` — order only, links preserved
- [x] POST `/api/plant/phases/:id/inputs` — supply validated via `SupplyItemsService.findOne`
- [x] DELETE `/api/plant/phases/:id/inputs/:inputId`

### Cross-cutting

- [x] MES JWT auth on all routes (`@Public()` + `MesJwtGuard`)
- [x] Tenant from `req.user.tenantId` only
- [x] `validate-structure.js` passes
- [x] Typecheck + plant tests pass
- [x] Postman updated (task 10)

---

## Acceptance criteria

- [x] All checklist items above verified before epic close.

---

## Validation commands

```bash
# Run when epic is complete (task 10)
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
```
