# MES-05 Task 10 — Postman & Final Validation

## Goal

Document MES-05 HTTP APIs in Postman, run smoke scenarios, and close the epic checklist.

**Depends on:** Tasks 01–09.

---

## Scope

- Postman collection + README for ticket routes only.
- Manual smoke for orders lifecycle + qa-approve.
- Chain behavior validated via unit tests or manual service invocation (no complete HTTP).
- Final validation commands.

---

## Out of Scope

- Implementation fixes unless smoke finds bugs.
- Schema changes.
- `POST /api/plant/phases/complete` in Postman.
- `lint:fix`.

---

## Files allowed

- `postman/restopsiq-api.collection.json`
- `postman/local.environment.json` — `orderId`, `executionId` variables
- `postman/README.md`
- `tasks/mes-plant/MES-05/00-epic-and-decisions.md` — mark checklist complete

---

## Files forbidden

- `apps/api/src/mes/auth/**` (logic changes)
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml` (unless task 07 not merged — should already be done)
- `scripts/validate-structure.js`

---

## Implementation notes

### Postman flow

1. `POST /api/mes/auth/login` — save `mesAccessToken`.
2. MES-02 setup: workstations + recipe (5 phases, one `requiresQA: true`).
3. Folder **Plant — Production Orders**.

### Minimum HTTP requests (ticket scope)

| Request                                     |
| ------------------------------------------- |
| POST `/api/plant/orders`                    |
| GET `/api/plant/orders`                     |
| GET `/api/plant/orders/:id`                 |
| PATCH `/api/plant/orders/:id/plan`          |
| POST `/api/plant/orders/:id/pause`          |
| POST `/api/plant/orders/:id/resume`         |
| POST `/api/plant/orders/:id/cancel`         |
| POST `/api/plant/executions/:id/qa-approve` |

Auth: `Authorization: Bearer {{mesAccessToken}}`.

**Do not add** `POST /api/plant/phases/complete`.

### Smoke scenarios

1. Create OP → GET detail → 5 executions, all `PENDING`.
2. Plan → phase order=1 is `READY`.
3. Cancel `IN_PROCESS` with `reason` + `consumedInputsAction`.
4. QA path: use unit tests or dev script calling `PhaseChainService.completeExecution` then Postman qa-approve.
5. WebSocket: observe `phase:status_changed` on plan / qa-approve.

### README

- Document order lifecycle endpoints (ticket list only).
- Note phase completion is internal until a later ticket.
- WS event name and payload fields.

---

## Acceptance criteria

- [ ] Postman includes all MES-05 HTTP routes (8 endpoints).
- [ ] No complete-phase request in collection.
- [ ] README updated.
- [ ] Epic checklist in `00-epic-and-decisions.md` complete.
- [ ] `validate-structure.js`, typecheck, plant tests, test:cov pass.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
pnpm --filter=@restopsiq/api run test:cov
# Manual: Postman + optional WS client
```
