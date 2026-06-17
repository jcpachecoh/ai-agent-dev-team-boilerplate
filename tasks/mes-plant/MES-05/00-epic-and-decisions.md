# MES-05 Task 00 — Epic & Locked Decisions

## Goal

Track epic-level progress and document decisions downstream tasks must follow.

**References:** `../MES-05-orders-phase-chain.md`

---

## Scope

- Checklist only; decision log for tasks 01–10.

---

## Out of Scope

- Any code changes.
- Schema or package changes.

---

## Files allowed

- `tasks/mes-plant/MES-05/00-epic-and-decisions.md` (this file)

---

## Files forbidden

- Everything under `apps/api/src/`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `postman/**` (until task 10)

---

## Implementation notes

### Locked decisions

| #   | Decision               | Value                                                                                |
| --- | ---------------------- | ------------------------------------------------------------------------------------ |
| D1  | Module location        | Extend `apps/api/src/mes/plant/`                                                     |
| D2  | Create OP executions   | Exactly N rows, all `PENDING`                                                        |
| D3  | Plan transition        | First phase (order=1) → `READY`                                                      |
| D4  | Chain on completion    | Prior `requiresQA=false` → next `READY`; prior `requiresQA=true` → next `QA_PENDING` |
| D5  | Phase completion HTTP  | **Not in MES-05** — internal `PhaseChainService` method only                         |
| D6  | WS event               | `phase:status_changed` with `{ orderId, phaseId, stationId, status }`                |
| D7  | Cancel inputs          | `consumedInputsAction` required when cancelling `IN_PROCESS`/`PAUSED`                |
| D8  | WebSocket packages     | Install only in task 07                                                              |
| D9  | Active execution guard | `status !== COMPLETED` (MES-05-00)                                                   |
| D10 | HTTP routes            | Ticket list only — no extra plant routes                                             |

### Epic checklist

#### Orders API

- [x] `POST /api/plant/orders`
- [x] `GET /api/plant/orders` — filters: status, shift, priority, date
- [x] `GET /api/plant/orders/:id`
- [x] `PATCH /api/plant/orders/:id/plan`
- [x] `POST /api/plant/orders/:id/pause` — reason required
- [x] `POST /api/plant/orders/:id/resume`
- [x] `POST /api/plant/orders/:id/cancel` — reason + consumedInputsAction rules

#### Phase runtime

- [x] `PhaseChainService` internal complete method
- [x] `POST /api/plant/executions/:id/qa-approve`
- [x] **No** `POST /api/plant/phases/complete`

#### Real-time

- [x] WebSocket `phase:status_changed`

#### Cross-cutting

- [x] MES JWT tenant scoping
- [x] RBAC on supervisor mutations
- [x] validate-structure + typecheck + tests pass
- [x] Postman updated (task 10)

---

## Acceptance criteria

- [x] All checklist items verified before epic close.
- [ ] No task contradicts D1–D10 without updating main spec.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
pnpm --filter=@restopsiq/api run test:cov
```
