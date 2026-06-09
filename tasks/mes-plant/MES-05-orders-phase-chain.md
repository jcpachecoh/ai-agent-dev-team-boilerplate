# MES-05 — Production Orders API & Phase Chain Engine

**Ticket:** MES-05  
**Branch:** `feature/mes-plant-core` (MES-02 masters + MES-04 schema)  
**Status:** Planned  
**Priority:** High

---

## Goal

Implement NestJS REST APIs for production order (OP) management and a `PhaseChainService` that advances phase executions through the recipe chain when a phase is completed via an internal service method, including QA gating and real-time WebSocket notifications.

---

## Scope

- Extend `apps/api/src/mes/plant/` with order/execution interfaces, repository transactions, services, controller routes, DTOs, and tests.
- Production order create, list, detail, plan, pause, resume, cancel.
- Atomic OP create: one `ProductionOrder` + N `PhaseExecution` rows (N = recipe phase count).
- `PhaseChainService`: invoked internally when a `PhaseExecution` is completed (not exposed as HTTP in MES-05).
- `POST /api/plant/executions/:id/qa-approve` for supervisor QA approval.
- WebSocket gateway emitting `phase:status_changed`.
- Postman updates (final task only).
- Unit tests for service, controller, phase chain, and gateway.

**Prerequisites (already on branch):**

- MES-04 schema: `ProductionOrder`, `PhaseExecution`, status enums, `OperatorSession.phaseExecutionId`.
- MES-02: `PlantModule`, masters API, `MesJwtGuard`, `MesRolesGuard`.
- MES-05-00: `hasActiveExecutionsForWorkStation` uses `status !== COMPLETED`.

---

## Out of Scope

- Prisma schema or migration changes (unless a follow-up ticket adds constraints or cancel metadata columns).
- Changes to `mes/auth` implementation (import guards only).
- Inventory/stock movement implementation (`consumedInputsAction` is audit-only).
- Operator session start/stop APIs (read active sessions in order detail only).
- **`POST /api/plant/phases/complete`** or any HTTP endpoint to complete a phase — deferred to a later ticket; `PhaseChainService` exposes an internal method only.
- `lint:fix` or repo-wide formatting.
- Seed data for sample OPs (optional follow-up).

---

## Architecture Decisions

| Decision             | Choice                                                  | Rationale                                                        |
| -------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| **Module path**      | Extend `apps/api/src/mes/plant/`                        | Same feature domain; `validate-structure.js` validates `plant`.  |
| **Route prefix**     | `@Controller('plant')`                                  | URLs `/api/plant/...`.                                           |
| **Tenant source**    | `req.user.tenantId` from MES JWT                        | No tenant spoofing.                                              |
| **Auth pattern**     | `@Public()` + `@UseGuards(MesJwtGuard)`                 | Same as MES-02 masters.                                          |
| **RBAC**             | `MesRolesGuard` + `@Roles(...)` on supervisor mutations | See RBAC section.                                                |
| **Order number**     | Service-generated `{YYYY}-{seq}` per tenant             | No DB unique yet; enforce in service.                            |
| **Phase completion** | Internal `PhaseChainService` method                     | Ticket defines chain on completion, not a public complete route. |
| **WebSocket deps**   | Install in task 07 only                                 | Not in `apps/api/package.json` today.                            |

---

## Route Contracts

All routes require `Authorization: Bearer <MES access token>`. Tenant from JWT (`req.user.tenantId`).

### Production Orders

| Method | Path                           | RBAC        | Description                                                              |
| ------ | ------------------------------ | ----------- | ------------------------------------------------------------------------ |
| POST   | `/api/plant/orders`            | SUPERVISOR+ | Create OP + all phase executions (transaction)                           |
| GET    | `/api/plant/orders`            | Any MES     | List with filters: `status`, `shift`, `priority`, date range             |
| GET    | `/api/plant/orders/:id`        | Any MES     | Full detail: order, executions, phase metadata, active operator sessions |
| PATCH  | `/api/plant/orders/:id/plan`   | SUPERVISOR+ | `DRAFT` → `PLANNED`; promote first phase to `READY`                      |
| POST   | `/api/plant/orders/:id/pause`  | SUPERVISOR+ | Pause OP (`reason` required)                                             |
| POST   | `/api/plant/orders/:id/resume` | SUPERVISOR+ | Resume paused OP                                                         |
| POST   | `/api/plant/orders/:id/cancel` | SUPERVISOR+ | Cancel OP (`reason` required; `consumedInputsAction` when applicable)    |

### Phase Execution — QA

| Method | Path                                   | RBAC        | Description                                      |
| ------ | -------------------------------------- | ----------- | ------------------------------------------------ |
| POST   | `/api/plant/executions/:id/qa-approve` | SUPERVISOR+ | Supervisor approves QA for a completed execution |

**Not in MES-05:** `POST /api/plant/phases/complete` — phase completion is triggered by internal service API until a later ticket adds HTTP.

---

## Production Order Lifecycle

```text
DRAFT ──plan──► PLANNED ──(internal phase start)──► IN_PROCESS
   │                │                                      │
   │                │                                      ├──pause──► PAUSED ──resume──► IN_PROCESS
   │                │                                      │
   └──cancel────────┴──────────────────────────────────────┴──cancel──► CANCELLED
                                                                               │
                                                                         all phases done
                                                                               ▼
                                                                          COMPLETED
```

### Rules

| Transition          | From                                       | To           | Side effects                                                          |
| ------------------- | ------------------------------------------ | ------------ | --------------------------------------------------------------------- |
| Create              | —                                          | `DRAFT`      | Generate `number`; snapshot `recipeVersion`; all executions `PENDING` |
| Plan                | `DRAFT`                                    | `PLANNED`    | First phase execution (recipe `order = 1`) → `READY`; emit WS         |
| Pause               | `IN_PROCESS`                               | `PAUSED`     | Active executions → `PAUSED`; store pause reason                      |
| Resume              | `PAUSED`                                   | `IN_PROCESS` | Restore paused executions to prior active state                       |
| Cancel              | `DRAFT`, `PLANNED`, `IN_PROCESS`, `PAUSED` | `CANCELLED`  | See task 08 for `consumedInputsAction`                                |
| Complete (implicit) | `IN_PROCESS`                               | `COMPLETED`  | When all executions `COMPLETED`                                       |

When first execution moves to `IN_PROCESS` (via future operator runtime ticket), set order `status = IN_PROCESS` and `actualStartAt` if null.

---

## PhaseExecution Lifecycle

```text
PENDING ──plan (phase 1 only)──► READY ──(future runtime)──► IN_PROCESS ──(internal complete)──► COMPLETED
                                    │
                                    └── QA_PENDING ──qa-approve──► READY
```

| Status       | Meaning                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `PENDING`    | Created with OP; not yet on station queue                                  |
| `READY`      | Available for operator to start (future runtime)                           |
| `IN_PROCESS` | Operator working the phase (future runtime)                                |
| `PAUSED`     | OP paused                                                                  |
| `QA_PENDING` | Prior phase completed with `requiresQA`; blocked until supervisor approves |
| `COMPLETED`  | Terminal                                                                   |

**Terminal execution status:** `COMPLETED` (workstation soft-delete guard: `status !== COMPLETED`).

---

## Create OP Transaction Strategy

In **repository** (service validates recipe, batch count, dates first):

```text
prisma.$transaction(async (tx) => {
  1. tx.productionOrder.create({ status: DRAFT, recipeVersion, number, ... })
  2. Load recipe phases ordered by `order` ASC
  3. For each phase (exactly once):
       tx.phaseExecution.create({
         orderId,
         phaseId,
         workStationId: phase.workStationId,
         status: PENDING,
         plannedMinutes: phase.standardMinutes * batchCount,
       })
  4. Return order + executions
})
```

### Invariants

- Recipe with **N phases** → exactly **N** `PhaseExecution` rows, all **`PENDING`**.
- No duplicate `phaseId` per order.
- `workStationId` denormalized on execution (MES-04).
- Recipe must be `isActive: true` and belong to tenant.

---

## Plan Transition — First Executable Phase

On `PATCH /orders/:id/plan` (`DRAFT` → `PLANNED`):

1. Validate order is `DRAFT`.
2. Find execution for recipe phase `order = 1`.
3. Update that execution: `PENDING` → `READY`.
4. All other executions remain `PENDING`.
5. Emit `phase:status_changed`.

---

## PhaseChainService Behavior

**Trigger:** Internal method e.g. `completeExecution(tenantId, executionId, payload)` — called by future operator/runtime module or unit tests in MES-05. **No HTTP route in this epic.**

### On phase completion (execution E for phase order K)

1. Validate E is in a completable state (e.g. `IN_PROCESS`).
2. Set E → `COMPLETED`, set `completedAt`, persist metrics/notes as provided.
3. Find next execution N for same order (recipe phase `order = K + 1`).
4. If no next phase: if all executions `COMPLETED`, set order → `COMPLETED` and `actualEndAt`.
5. If next exists:
   - If **completed phase K** has `requiresQA = false` → N → **`READY`**.
   - If **completed phase K** has `requiresQA = true` → N → **`QA_PENDING`** (not `READY`).
6. Emit `phase:status_changed` for each changed execution.

### On QA approve (`POST /executions/:id/qa-approve`)

1. Target execution E must be `COMPLETED`, `phase.requiresQA = true`, `qaApprovedAt` null.
2. Set `qaApprovedAt`, `qaApprovedBy`.
3. Find next execution N (phase order + 1).
4. If N is `QA_PENDING`, set N → **`READY`**.
5. Emit WS event.

---

## requiresQA Rules

- Flag on `ProductionPhase.requiresQA` (recipe master).
- Evaluated on the **completed** phase (prior phase), not the next phase.
- **Prior does not require QA:** next phase → `READY` after completion.
- **Prior requires QA:** next phase → `QA_PENDING` until supervisor `qa-approve` on the completed execution.

---

## WebSocket — `phase:status_changed`

### Event

- Name: `phase:status_changed`
- Payload (minimum):

```typescript
{
  orderId: string;
  phaseId: string;
  stationId: string; // workStationId
  status: string; // PhaseExecutionStatus enum value
}
```

### Backend behavior (task 07)

- NestJS `@WebSocketGateway` with Socket.IO adapter.
- Broadcast to tenant room on status changes (plan, chain advance, qa-approve, pause, resume).
- Packages **not installed today** — add in task 07 only:
  - `@nestjs/websockets`
  - `@nestjs/platform-socket.io`
  - `socket.io`

---

## Cancel IN_PROCESS — Consumed Inputs

When cancelling an order in `IN_PROCESS` or `PAUSED`, request body **must** include:

| Field                  | Required                                |
| ---------------------- | --------------------------------------- |
| `reason`               | Always (non-empty)                      |
| `consumedInputsAction` | When status is `IN_PROCESS` or `PAUSED` |

Enum: `SCRAP` | `RETURN_TO_STOCK` | `HOLD_FOR_REVIEW`

- No inventory ledger writes in MES-05 — persist for audit in order `notes` (JSON fragment).
- **Policy locked:** `tasks/mes-plant/MES-05/08-cancel-consumed-inputs-decision.md` (task 08).

---

## RBAC Assumptions

| Role                             | Permissions                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| `OPERATOR`                       | Read orders/detail (future runtime uses internal chain, not HTTP in MES-05) |
| `MANAGER`, `SUPERVISOR`, `OWNER` | Create/plan/pause/resume/cancel orders, `qa-approve`                        |
| All authenticated                | `GET /orders`, `GET /orders/:id`                                            |

Use `@UseGuards(MesJwtGuard, MesRolesGuard)` + `@Roles(...)` on supervisor mutations.

---

## Testing Strategy

| Layer             | Approach                                                                                |
| ----------------- | --------------------------------------------------------------------------------------- |
| Repository        | Mock Prisma; assert create tx produces N executions                                     |
| Orders service    | State transitions, cancel body rules, tenant safety                                     |
| PhaseChainService | Unit test internal `completeExecution`: READY vs QA_PENDING paths; qa-approve promotion |
| Controller        | Mock services; JWT tenantId; RBAC on routes                                             |
| Gateway           | Mock emit; payload shape                                                                |
| E2E               | Postman smoke in task 10                                                                |

---

## Postman Strategy

1. MES login → save `mesAccessToken`.
2. Create workstation + recipe (5 phases, one with `requiresQA: true`) via MES-02 requests.
3. Add folder **Plant — Production Orders** with all MES-05 HTTP routes.
4. Smoke: create OP → 5 `PENDING` → plan → phase 1 `READY` → invoke chain via service test or future runtime stub → qa-approve path.

Update: `postman/restopsiq-api.collection.json`, `postman/README.md` (task 10 only).

---

## Acceptance Criteria (Epic-level)

- [ ] `POST /api/plant/orders` with 5-phase recipe creates exactly 5 `PhaseExecution` rows, all `PENDING`.
- [ ] `PATCH /api/plant/orders/:id/plan` moves order to `PLANNED` and first execution to `READY`.
- [ ] Internal phase completion: if prior phase `requiresQA=false`, next → `READY`.
- [ ] Internal phase completion: if prior phase `requiresQA=true`, next → `QA_PENDING`.
- [ ] `POST /api/plant/executions/:id/qa-approve` promotes `QA_PENDING` next phase to `READY`.
- [ ] Status changes emit `phase:status_changed`.
- [ ] Cancel `IN_PROCESS` requires `reason` + `consumedInputsAction`.
- [ ] No `POST /api/plant/phases/complete` route in MES-05.
- [ ] All routes tenant-scoped via MES JWT.
- [ ] `validate-structure.js`, typecheck, and plant tests pass.

---

## Validation Commands (Epic)

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
pnpm --filter=@restopsiq/api run test:cov
```

---

## Subtask Breakdown

| File                                           | Title                                      |
| ---------------------------------------------- | ------------------------------------------ |
| `MES-05/00-epic-and-decisions.md`              | Epic checklist & locked decisions          |
| `MES-05/01-orders-interfaces-and-dtos.md`      | Interfaces + DTOs                          |
| `MES-05/02-orders-repository-transactions.md`  | Repository + create OP transaction         |
| `MES-05/03-orders-service-lifecycle.md`        | Order lifecycle service                    |
| `MES-05/04-orders-controller-routes.md`        | Order HTTP routes                          |
| `MES-05/05-phase-chain-service.md`             | PhaseChainService (internal complete only) |
| `MES-05/06-qa-approve-endpoint.md`             | QA approve HTTP route                      |
| `MES-05/07-websocket-phase-events.md`          | Gateway + Socket.IO deps                   |
| `MES-05/08-cancel-consumed-inputs-decision.md` | Cancel inputs policy                       |
| `MES-05/09-tests.md`                           | Unit tests                                 |
| `MES-05/10-postman-and-final-validation.md`    | Postman + final gates                      |

---

## Risks / Follow-ups

- **Complete-phase HTTP:** Later ticket must expose operator completion endpoint and call `PhaseChainService`.
- **Order number uniqueness:** No DB constraint; add `@@unique([tenantId, number])` in follow-up migration.
- **Operator runtime:** Start/pause/complete phase on KDS not in MES-05.
- **Inventory epic:** `consumedInputsAction` audit-only until stock module exists.
- **WebSocket auth:** Validate MES JWT on gateway connect (task 07).
- **Coverage gate:** Keep `test:cov` ≥ 80% branches/functions.

---

## References

- Schema: `apps/api/prisma/schema.prisma`
- Masters API: `tasks/mes-plant/MES-02-rest-api-plant-masters.md`
- MES-05-00: active execution = `status !== COMPLETED`
