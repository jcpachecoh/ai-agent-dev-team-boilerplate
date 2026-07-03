# MES-05 Task 06 — QA Approve Endpoint

## Goal

Implement `POST /api/plant/executions/:id/qa-approve` and wire it to `PhaseChainService` to unblock `QA_PENDING` next phases.

**Depends on:** Task 05.

---

## Scope

- Service method `qaApproveExecution(tenantId, executionId, supervisorId, notes?)`.
- Controller route on `PlantController`.
- Promote next execution `QA_PENDING` → `READY`.

---

## Out of Scope

- WebSocket emit (task 07).
- Phase completion HTTP.
- Schema changes.
- Tests (task 09).

---

## Files allowed

- `apps/api/src/mes/plant/service/phase-chain.service.ts` — extend
- `apps/api/src/mes/plant/controller/plant.controller.ts` — add route only
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend if needed

---

## Files forbidden

- `apps/api/src/mes/auth/**` (logic changes)
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `postman/**`

---

## Implementation notes

### Route

```
POST /api/plant/executions/:id/qa-approve
@UseGuards(MesJwtGuard, MesRolesGuard)
@Roles(SUPERVISOR, MANAGER, OWNER)
Optional body: { notes?: string }
```

### Preconditions

- Execution exists for tenant.
- Phase `requiresQA === true`.
- Execution `COMPLETED`, `qaApprovedAt` null.
- Order not `CANCELLED`.

### Actions

1. Set `qaApprovedAt`, `qaApprovedBy`.
2. Find next execution; if `QA_PENDING` → `READY`.
3. Return updated execution or detail slice.

### Errors

404 not found; 400 invalid state; 409 cancelled order; 403 wrong role.

---

## Acceptance criteria

- [ ] Route registered and supervisor-only.
- [ ] QA approve promotes next `QA_PENDING` → `READY`.
- [ ] Double approve rejected.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=phase-chain
node scripts/validate-structure.js
```
