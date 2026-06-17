# MES-08 — AlarmService Cron, BullMQ Workers & Incidents API

**Ticket:** MES-08  
**Branch:** `feature/mes-plant-core` (MES-05 orders + plant gateway)  
**Status:** Planned  
**Priority:** High

---

## Goal

Implement automatic plant alarms (cron evaluation + BullMQ notification worker), persisted deduplication, WebSocket `alarm:triggered`, and a separate **manual incidents** REST API with supervisor resolution.

---

## Scope

- Prisma schema additions: `PhaseExecution.startedAt`, alarm dedup persistence, `ProductionIncident` model.
- Pure alarm evaluation rules (TIEMPO_EXCEDIDO, FASE_SIN_OPERARIO, OP_RETRASADA).
- NestJS `AlarmService` cron (60s) enqueueing BullMQ jobs per tenant.
- Notification worker: WebSocket emit, OneSignal adapter (stub OK in first pass), emergency endpoint adapter (stub OK).
- Incidents HTTP: `POST/GET /api/plant/incidents`, `PATCH /api/plant/incidents/:id/resolve`.
- WebSocket: `alarm:triggered`, `incident:created`.
- Unit tests + validation gates.

**Prerequisites (already on branch):**

- MES-05: `PlantModule`, orders, `PhaseExecution`, `OperatorSession`, `PlantGateway`, `phase:status_changed`.
- MES Auth: `MesJwtGuard`, tenant from JWT.
- Redis available locally (`REDIS_URL`).
- Email package BullMQ pattern (`@restopsiq/email`) as reference — **do not reuse email queue**.

---

## Out of Scope

- Changes to `apps/plant/**` or legacy KDS frontend wiring (MES-08 follows **ticket HTTP/WS contract** only).
- `PlantOperator` model from MES-06 ticket draft (use existing `OperationalUser` + `OperatorSession`).
- Operator session login HTTP (MES-06) — alarm logic uses `OperatorSession` rows when they exist.
- Phase runtime HTTP (`start` / `complete` phase) — tests may seed `IN_PROCESS` + `startedAt` directly.
- Real OneSignal / emergency HTTP integration in first implementation (adapters stubbed per D8).
- Photo upload/storage infrastructure (incident `photoUrl` optional string field only; no S3 in MES-08).
- `lint:fix`, repo-wide formatting.
- Postman updates (optional follow-up unless task 09 explicitly adds smoke docs).

---

## Architecture Decisions

| Decision                    | Choice                                                          | Rationale                                                         |
| --------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Module path**             | Extend `apps/api/src/mes/plant/`                                | Same domain as orders; `validate-structure.js` validates `plant`. |
| **Alarms vs incidents**     | Separate models (`PlantAlarmDispatch` + `ProductionIncident`)   | Automatic cron alarms ≠ operator-reported novedades (D4).         |
| **Execution start time**    | Add `PhaseExecution.startedAt` column (D1)                      | TIEMPO_EXCEDIDO requires execution start, not session proxy.      |
| **Active operator session** | `endedAt IS NULL` (D2)                                          | No `isActive` column on current schema.                           |
| **Dedup**                   | Persist `{ executionId, alarmType }` with 30-minute window (D5) | Ticket criterion; survives process restarts.                      |
| **Cron**                    | `@nestjs/schedule` every 60s                                    | Ticket; enqueue only, no heavy work on main thread.               |
| **Queue**                   | Dedicated BullMQ queue `plant-alarm-notifications`              | Separate from `email-queue`.                                      |
| **Push / emergency**        | Adapter interfaces; stub implementations first (D8)             | Enables tests without external deps.                              |
| **Tenant scope**            | Cron iterates distinct tenants with active plant data           | Avoid cross-tenant leakage.                                       |
| **Auth**                    | MES JWT on HTTP; gateway JWT on WS (existing pattern)           | Same as MES-05.                                                   |

---

## Alarm Rules (Ticket)

| Type                | Condition                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `TIEMPO_EXCEDIDO`   | `status = IN_PROCESS` AND `(now - execution.startedAt) > phase.standardMinutes * 1.2`                      |
| `FASE_SIN_OPERARIO` | `status = IN_PROCESS` AND no `OperatorSession` with `endedAt IS NULL` linked to execution for > 15 minutes |
| `OP_RETRASADA`      | Order `status != COMPLETED` AND `(plannedEndAt - now) < 30 minutes`                                        |

**Severity mapping (locked in task 00):**

| Type                | Default severity |
| ------------------- | ---------------- |
| `TIEMPO_EXCEDIDO`   | `warning`        |
| `FASE_SIN_OPERARIO` | `critical`       |
| `OP_RETRASADA`      | `warning`        |

CRITICAL severity triggers emergency adapter (stub logs call in MVP).

---

## HTTP Route Contracts

All routes require `Authorization: Bearer <MES access token>`. Tenant from JWT.

### Incidents (manual)

| Method | Path                               | RBAC        | Description                                             |
| ------ | ---------------------------------- | ----------- | ------------------------------------------------------- |
| POST   | `/api/plant/incidents`             | OPERATOR+   | Operator reports novedad (optional photo URL)           |
| GET    | `/api/plant/incidents`             | SUPERVISOR+ | List/filter by order, station, type, severity, resolved |
| PATCH  | `/api/plant/incidents/:id/resolve` | SUPERVISOR+ | Supervisor closes with resolution text                  |

**No alarm CRUD HTTP** — alarms are system-generated only.

---

## WebSocket Events

| Event              | Emitter                                | Payload (minimum)                                                     |
| ------------------ | -------------------------------------- | --------------------------------------------------------------------- |
| `alarm:triggered`  | Notification worker via `PlantGateway` | `{ alarmType, severity, stationId, orderId?, executionId?, message }` |
| `incident:created` | Incidents service on POST              | `{ incidentId, stationId, orderId?, executionId?, severity, type }`   |

Room: `tenant:{tenantId}` (supervisor dashboard). Optional `station:{stationId}` fan-out if task 08 specifies.

---

## Epic Acceptance Criteria

- [ ] Cron evaluates 10 active OPs in **< 500ms** (unit/benchmark test in task 09).
- [ ] `alarm:triggered` emitted within worker path after dedup passes (integration/unit with mocked gateway).
- [ ] Same `{ executionId, alarmType }` not re-dispatched within 30 minutes.
- [ ] Incidents CRUD routes tenant-scoped; resolve sets `resolvedAt` + `resolvedBy`.
- [ ] Automatic alarms and manual incidents stored in **separate** tables.
- [ ] OneSignal + emergency adapters invoked behind interfaces (stub OK).
- [ ] `validate-structure.js`, typecheck, plant+alarm tests pass.
- [ ] No dependency on `apps/plant` client changes in MES-08 tasks.

---

## Validation Commands (Epic)

```bash
cd apps/api && pnpm prisma validate && pnpm prisma format
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='plant|alarm|incident'
pnpm --filter=@restopsiq/api run test:cov
```

---

## Subtask Breakdown

| File                                                  | Title                              |
| ----------------------------------------------------- | ---------------------------------- |
| `MES-08-alarms-incidents/00-epic-decisions.md`        | Epic checklist & locked decisions  |
| `MES-08-alarms-incidents/01-schema-migration.md`      | Prisma schema + migration          |
| `MES-08-alarms-incidents/02-contracts-dtos.md`        | Interfaces + DTOs                  |
| `MES-08-alarms-incidents/03-alarm-evaluator.md`       | Pure evaluation rules              |
| `MES-08-alarms-incidents/04-alarm-repository.md`      | Alarm queries + dedup persistence  |
| `MES-08-alarms-incidents/05-cron-enqueue.md`          | AlarmService cron + BullMQ enqueue |
| `MES-08-alarms-incidents/06-notification-worker.md`   | Worker + push/emergency adapters   |
| `MES-08-alarms-incidents/07-incidents-service-api.md` | Incidents service + controller     |
| `MES-08-alarms-incidents/08-websocket-events.md`      | Gateway emit helpers               |
| `MES-08-alarms-incidents/09-tests-validation.md`      | Tests + perf gate                  |

---

## Risks / Follow-ups

- **Phase runtime ticket** must set `PhaseExecution.startedAt` when moving to `IN_PROCESS` (document coordination; MES-08 adds column + reads it).
- **Operator session APIs (MES-06)** improve FASE_SIN_OPERARIO signal quality but are not hard blockers for MES-08 tests.
- **Photo upload** deferred — accept optional URL string until storage epic.
- **Postman folder** for incidents optional follow-up.
- **Multi-instance cron** — only one scheduler should run per deployment (document ops note; out of code scope unless requested).

---

## References

- Main spec: this file
- Prior art: `tasks/mes-plant/MES-05-orders-phase-chain.md`, `tasks/mes-plant/MES-05/07-websocket-phase-events.md`
- Plant WS client types (informational only): `apps/plant/src/services/plant-socket.service.ts`
- Email BullMQ pattern: `packages/email/src/email.service.ts`
