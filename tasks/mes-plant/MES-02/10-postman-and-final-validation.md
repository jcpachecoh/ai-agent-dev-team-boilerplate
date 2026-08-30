# MES-02 Task 10 — Postman & Final Validation

## Goal

Document plant master APIs in Postman and run final validation gates for the MES-02 epic.

**Depends on:** Tasks 01–09.

---

## Scope

- Update Postman collection and environment variables for plant routes.
- Manual smoke checklist for key acceptance paths.
- Final command run list.

---

## Out of Scope

- Implementation code changes unless fixing bugs found during smoke test.
- Schema/migration changes.
- `lint:fix`.

---

## Files allowed

- `postman/restopsiq-api.collection.json` — add plant requests
- `postman/local.environment.json` — add variables if needed (e.g. `workstationId`, `recipeId`, `mesAccessToken`)
- `postman/README.md` — document MES plant flow (login → plant CRUD)

---

## Files forbidden

- `apps/api/src/mes/auth/**` (no logic changes)
- `apps/api/src/supplyitems/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Implementation notes

### Postman flow

1. `POST /api/mes/auth/login` with `x-tenant-id` + cédula/PIN (existing).
2. Save `accessToken` to environment.
3. Plant requests: `Authorization: Bearer {{mesAccessToken}}` — **no** `x-tenant-id` on plant routes.

### Minimum requests to add

- Workstations: POST, GET, PATCH, DELETE
- Recipes: POST (nested), GET list, GET :id, PATCH, POST clone, DELETE
- Reorder: PATCH `recipes/:id/phases/reorder`
- Inputs: POST phase input, DELETE phase input

### Smoke scenarios

- Create recipe with 2 phases and inputs → GET detail shows `totalStandardMinutes`.
- Reorder phases → GET detail shows new order; inputs unchanged.
- Deactivate workstation with active execution → expect 4xx.
- Invalid `supplyItemId` on input → 404.

---

## Acceptance criteria

- [ ] Postman collection includes all MES-02 routes with Bearer auth.
- [ ] README explains MES JWT vs `x-tenant-id` usage.
- [ ] `node scripts/validate-structure.js` exits 0.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=plant` passes.
- [ ] Epic checklist in `00-epic-and-acceptance.md` marked complete.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
# Manual: import Postman collection and run plant folder
```
