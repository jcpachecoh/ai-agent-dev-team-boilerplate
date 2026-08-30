# MES-08 Task 00 — Epic & Locked Decisions

## Goal

Lock architectural decisions for alarms, deduplication, incidents, and adapter boundaries before any implementation task.

**References:** `../MES-08-alarms-incidents.md`

---

## Scope

- Decision log + epic checklist for tasks 01–09.
- Analysis-only reconciliation with MES-05 schema (no code).

---

## Out of Scope

- Application code.
- Prisma migrations.
- Package installs.

---

## Files allowed

- `tasks/mes-plant/MES-08-alarms-incidents/00-epic-decisions.md` (this file)
- `tasks/mes-plant/MES-08-alarms-incidents.md` — checklist cross-refs only

---

## Files forbidden

- Everything under `apps/api/src/`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/plant/**`
- `postman/**`

---

## Locked decisions

| #   | Decision                | Value                                                                                                                                                                                         |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Execution start time    | Add **`PhaseExecution.startedAt`** nullable column; set when execution enters `IN_PROCESS` (future runtime); TIEMPO_EXCEDIDO uses this field only                                             |
| D2  | Active operator session | **`endedAt IS NULL`** defines active session; do **not** add `OperatorSession.isActive` in MES-08                                                                                             |
| D3  | Alarms vs incidents     | **Separate models**: system `PlantAlarmDispatch` (dedup/dispatch audit) vs manual `ProductionIncident`                                                                                        |
| D4  | Dedup key               | **`{ tenantId, executionId, alarmType }`** OR `{ tenantId, orderId, alarmType }` for `OP_RETRASADA` (no executionId) — persisted with **`dispatchedAt`**; suppress repeats for **30 minutes** |
| D5  | Dedup storage           | DB table `plant_alarm_dispatches` (not Redis-only) for audit + restart safety                                                                                                                 |
| D6  | Module location         | Extend **`apps/api/src/mes/plant/`** (services/repository/controller); no new top-level Nest module unless validate-structure requires split (default: stay in plant)                         |
| D7  | Cron                    | `@Cron('*/60 * * * * *')` or `@Interval(60000)` — evaluate all tenants; **enqueue BullMQ jobs**, never call OneSignal/WS in cron                                                              |
| D8  | External integrations   | **OneSignal** + **emergency HTTP** behind adapter interfaces; **stub implementations** acceptable in tasks 06–09                                                                              |
| D9  | Frontend                | MES-08 **must not** modify or depend on `apps/plant/**`; ticket HTTP/WS contract is source of truth                                                                                           |
| D10 | Auth / tenant           | HTTP: MES JWT; cron/worker: tenantId from job payload; no tenantId from request body                                                                                                          |
| D11 | RBAC incidents          | POST: `OPERATOR+`; GET list + resolve: `SUPERVISOR+` (OWNER included)                                                                                                                         |
| D12 | WS events               | `alarm:triggered` (worker); `incident:created` (POST incident); extend `PlantGateway` / `PlantEventsService`                                                                                  |

---

## Epic checklist

### Schema (task 01)

- [x] `PhaseExecution.startedAt` added
- [x] `PlantAlarmDispatch` (or equivalent) for dedup audit
- [x] `ProductionIncident` for manual reports
- [x] Enums: `PlantAlarmType`, `AlarmSeverity`, `IncidentType` (names finalized in task 01)

### Alarm pipeline (tasks 03–06)

- [x] Pure evaluator: TIEMPO_EXCEDIDO, FASE_SIN_OPERARIO, OP_RETRASADA
- [x] Repository queries active executions/orders per tenant
- [x] Dedup suppresses repeat within 30 min
- [x] Cron enqueues BullMQ jobs only
- [x] Worker emits WS + calls adapters (stub OK)

### Incidents API (task 07)

- [x] `POST /api/plant/incidents`
- [x] `GET /api/plant/incidents` with filters
- [x] `PATCH /api/plant/incidents/:id/resolve`

### Real-time (task 08)

- [x] `alarm:triggered` payload documented and emitted
- [x] `incident:created` payload documented and emitted

### Cross-cutting (task 09)

- [x] Benchmark: 10 OPs evaluation < 500ms
- [x] validate-structure + typecheck + tests pass
- [x] No `apps/plant` changes in MES-08

---

## Acceptance criteria

- [ ] All locked decisions D1–D12 recorded.
- [ ] No implementation task contradicts D1–D12 without updating this file + main spec.

---

## Validation commands

Spec-only — none required for task 00.
