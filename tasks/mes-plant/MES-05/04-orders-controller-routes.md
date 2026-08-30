# MES-05 Task 04 — Orders Controller Routes

## Goal

Expose MES-05 production order HTTP routes on `PlantController` with MES JWT and supervisor RBAC.

**Depends on:** Tasks 01, 03.

---

## Scope

- Add order routes to `plant.controller.ts`.
- Wire DTOs and Swagger.
- Pass `req.user.tenantId` and operator id to service.

---

## Out of Scope

- QA approve route (task 06).
- PhaseChainService or internal complete (task 05).
- WebSocket gateway.
- Tests (task 09).

---

## Files allowed

- `apps/api/src/mes/plant/controller/plant.controller.ts` — extend

---

## Files forbidden

- `apps/api/src/mes/auth/**` (logic changes)
- `apps/api/src/mes/plant/service/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `postman/**`

---

## Implementation notes

### Routes (ticket scope only)

| Method | Path                | Roles                      |
| ------ | ------------------- | -------------------------- |
| POST   | `orders`            | SUPERVISOR, MANAGER, OWNER |
| GET    | `orders`            | any authenticated          |
| GET    | `orders/:id`        | any authenticated          |
| PATCH  | `orders/:id/plan`   | SUPERVISOR+                |
| POST   | `orders/:id/pause`  | SUPERVISOR+                |
| POST   | `orders/:id/resume` | SUPERVISOR+                |
| POST   | `orders/:id/cancel` | SUPERVISOR+                |

Import `MesRolesGuard`, `@Roles` from mes auth (import only).

### Controller rules

- Inject service only.
- No business logic.
- Tenant never from body/query.
- Register `orders` routes without conflicting MES-02 paths.

**Do not add** `POST phases/complete` or any completion route.

---

## Acceptance criteria

- [ ] All seven order routes delegate to service with JWT tenantId.
- [ ] Supervisor routes use `MesRolesGuard`.
- [ ] Swagger documents DTOs.
- [ ] No complete-phase route exists.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
node scripts/validate-structure.js
```
