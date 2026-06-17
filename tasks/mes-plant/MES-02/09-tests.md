# MES-02 Task 09 — Unit Tests

## Goal

Add service and controller unit tests for the plant module following workspace conventions.

**Depends on:** Tasks 03–08.

---

## Scope

- `apps/api/src/mes/plant/test/plant.service.spec.ts`
- `apps/api/src/mes/plant/test/plant.controller.spec.ts`

---

## Out of Scope

- E2E or integration tests against real DB.
- Postman (task 10).
- Changes to `mes-auth` or `supplyitems` tests.

---

## Files allowed

- `apps/api/src/mes/plant/test/plant.service.spec.ts` — create
- `apps/api/src/mes/plant/test/plant.controller.spec.ts` — create

---

## Files forbidden

- `apps/api/src/mes/auth/test/**`
- `apps/api/src/supplyitems/test/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Service tests (mock repository + SupplyItemsService)

| Scenario                | Expected                                                    |
| ----------------------- | ----------------------------------------------------------- |
| Create recipe           | Repository `createRecipeWithPhasesTx` called once           |
| Versioning              | Prior active recipe deactivated; version incremented        |
| Recipe detail           | `totalStandardMinutes` equals sum of phase minutes          |
| Workstation soft delete | `ConflictException` when `hasActiveExecutions` true         |
| Reorder                 | Repository `reorderPhasesTx` called; invalid phaseId throws |
| Phase input add         | `SupplyItemsService.findOne` called; 404 propagates         |

### Controller tests (mock PlantService)

- Verify each route calls service with `tenantId` from mock `req.user.tenantId`.
- Verify guards metadata present if testable (optional).

### Patterns

- Follow `supplyitems.service.spec.ts` and `mes-auth.controller.spec.ts` style.
- No real Prisma client.

---

## Acceptance criteria

- [ ] `plant.service.spec.ts` covers workstation guard, versioning, totalStandardMinutes, reorder, supply validation.
- [ ] `plant.controller.spec.ts` covers route delegation and tenantId from JWT user.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=plant` passes.
- [ ] `node scripts/validate-structure.js` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
```
