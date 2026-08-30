# MES-08 Task 10 — Manual Testing Package

## Goal

Verify MES-08 end-to-end without changing runtime code: incidents API, RBAC, tenant safety, alarm cron enqueue, BullMQ worker notifications, WebSocket events, and 30-minute deduplication.

**Depends on:** Tasks 01–09 (implementation complete).

---

## Prerequisites

### Local services

| Service             | Required | Notes                                                                      |
| ------------------- | -------- | -------------------------------------------------------------------------- |
| API                 | Yes      | `cd apps/api && pnpm start:dev` (default `http://localhost:3001`)          |
| PostgreSQL          | Yes      | Migrations applied + `pnpm db:seed`                                        |
| Redis               | Yes      | BullMQ queue + MES JWT blacklist / rate limits                             |
| BullMQ alarm worker | Yes      | Enabled by default; set `PLANT_ALARM_WORKER_ENABLED=false` only to disable |

### Seed credentials (local/dev only)

| Role                | Cédula     | PIN    | Variable             |
| ------------------- | ---------- | ------ | -------------------- |
| OWNER (supervisor+) | `12345678` | `1234` | `mesTokenSupervisor` |
| OPERATOR            | `87654321` | `4321` | `mesTokenOperator`   |

Tenant: `palos-de-lena` (`x-tenant-id` on MES login only).

### Postman setup

1. Import `postman/restopsiq-api.collection.json` and `postman/local.environment.json`.
2. Run `cd apps/api && pnpm db:seed`.
3. Start Redis (`docker compose up -d redis` or local Redis on `6379`).
4. Ensure API env has `REDIS_URL=redis://localhost:6379` and **does not** set `PLANT_ALARM_WORKER_ENABLED=false`.

### Recommended Postman run order

1. **MES Auth → Login Owner** — sets `mesTokenSupervisor` + `mesAccessToken`.
2. **MES Auth → Login Operator** — sets `mesTokenOperator`.
3. **Plant — Production Orders** (full folder) — sets `workStationId`, `orderId`, `executionId`.
4. **Plant — Alarms & Incidents (MES-08)** — incidents + RBAC smoke.

---

## Postman variables

| Variable             | Set by                  | Purpose                              |
| -------------------- | ----------------------- | ------------------------------------ |
| `baseUrl`            | Environment             | API host                             |
| `tenantId`           | Environment             | Operational tenant (`palos-de-lena`) |
| `mesTokenOperator`   | Login Operator          | Operator JWT                         |
| `mesTokenSupervisor` | Login Owner             | Supervisor+ JWT (OWNER in seed)      |
| `workStationId`      | Create Work Station     | Incident + alarm station scope       |
| `orderId`            | Create Production Order | Incident filters + OP_RETRASADA      |
| `executionId`        | Create / Get Order      | Incident + execution alarms          |
| `incidentId`         | Create Incident         | Resolve PATCH                        |

Legacy alias: `mesAccessToken` = supervisor token (backward compatible with MES-05 folders).

---

## Manual test scenarios

### 1. Operator can create incident

1. Run **MES Auth → Login Operator**.
2. Run **Plant — Alarms & Incidents → Create Incident (Operator)**.
3. Expect **201** with `id`, `workStationId`, `type`, `severity`, `description`.
4. Postman stores `incidentId`.

Optional: include `photoUrl` (URL string only — no file upload in MES-08).

### 2. Operator cannot list or resolve incidents

1. With `mesTokenOperator` still valid, run:
   - **List Incidents — Operator forbidden (negative)** → expect **403**
   - **Resolve Incident — Operator forbidden (negative)** → expect **403**

RBAC: list/resolve require `SUPERVISOR`, `MANAGER`, or `OWNER`.

### 3. Supervisor can list and resolve incidents

1. Run **MES Auth → Login Owner** (supervisor token).
2. **List Incidents (Supervisor)** with filters:
   - `orderId`, `workStationId`, `type=QUALITY`, `severity=WARNING`, `resolved=false`
3. Expect **200** array containing the created incident.
4. **Resolve Incident (Supervisor)** with body `{ "resolution": "..." }`.
5. Expect **200** with `resolvedAt`, `resolvedBy`, `resolution` populated.
6. Re-run list with `resolved=true` — incident appears in resolved filter.

Second resolve on same id → **409** (`Incident is already resolved`).

### 4. Wrong tenant references are rejected

Run **Create Incident — Invalid workStationId (negative)** with operator token and a UUID that does not belong to `palos-de-lena`.

Expect **400** with message like `workStationId does not belong to tenant`.

Same validation applies to invalid `orderId` / `executionId` (not in Postman negative request — verify manually with fake UUIDs).

### 5. `incident:created` WebSocket event

Connect a Socket.IO client to the API with the MES JWT.

**Connection (example with [socket.io-client](https://socket.io/docs/v4/client-api/)):**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: '<mesTokenSupervisor or mesTokenOperator>',
    stationId: '<workStationId>', // optional — joins station:{id} room
  },
});

socket.on('connect', () => console.log('connected'));
socket.on('incident:created', (payload) => console.log('incident:created', payload));
```

**Expected payload:**

```json
{
  "incidentId": "...",
  "stationId": "...",
  "orderId": "...",
  "executionId": "...",
  "type": "QUALITY",
  "severity": "WARNING"
}
```

**Emit path:** `IncidentService.createIncident` → `PlantEventsService.emitIncidentCreated` → `PlantGateway.emitIncidentCreated`.

Rooms: `tenant:{tenantId}` and `station:{workStationId}` when `stationId` is present.

Create an incident via Postman while the client is connected — event should arrive immediately.

### 6. `alarm:triggered` WebSocket event (worker flow)

Alarms are **not** exposed as HTTP. Flow:

1. **AlarmService** cron (`@Interval(60000)`) evaluates tenants → creates `PlantAlarmDispatch` → enqueues BullMQ job.
2. **AlarmNotificationWorker** processes job → `AlarmNotificationService.processNotification`.
3. Worker emits **`alarm:triggered`** via `PLANT_ALARM_EVENTS` → `PlantEventsService` → `PlantGateway`.

**Listen:**

```javascript
socket.on('alarm:triggered', (payload) => console.log('alarm:triggered', payload));
```

**Expected payload:**

```json
{
  "alarmType": "TIEMPO_EXCEDIDO",
  "severity": "WARNING",
  "stationId": "...",
  "orderId": "...",
  "executionId": "...",
  "message": "..."
}
```

Stub adapters log push/emergency calls to API stdout (no real OneSignal/webhook in local dev unless configured).

### 7. Alarm rule scenarios

Prepare one active order + execution in the DB (Production Orders Postman flow + manual SQL/status updates).

#### TIEMPO_EXCEDIDO (WARNING)

Conditions:

- `phase_executions.status = IN_PROCESS`
- `startedAt` set
- `(now - startedAt) > standardMinutes × 1.2`

Example for `standardMinutes = 10`:

```sql
UPDATE phase_executions
SET status = 'IN_PROCESS',
    "startedAt" = NOW() - INTERVAL '15 minutes'
WHERE id = '<executionId>';
```

Wait up to **60 seconds** for cron → check API logs for enqueue → worker → `alarm:triggered`.

#### FASE_SIN_OPERARIO (CRITICAL — triggers emergency stub)

Conditions:

- `status = IN_PROCESS`
- `startedAt` set
- No active `operator_sessions` row with `endedAt IS NULL` for that execution/station
- `(now - startedAt) > 15 minutes`

```sql
UPDATE operator_sessions SET "endedAt" = NOW() WHERE "phaseExecutionId" = '<executionId>' AND "endedAt" IS NULL;

UPDATE phase_executions
SET status = 'IN_PROCESS',
    "startedAt" = NOW() - INTERVAL '20 minutes'
WHERE id = '<executionId>';
```

CRITICAL severity → emergency adapter stub runs (check API logs).

#### OP_RETRASADA (WARNING)

Conditions:

- `production_orders.status != COMPLETED`
- `plannedEndAt - now <= 30 minutes` (or already overdue)

```sql
UPDATE production_orders
SET status = 'IN_PROCESS',
    "plannedEndAt" = NOW() + INTERVAL '20 minutes'
WHERE id = '<orderId>';
```

### 8. Deduplication (30 minutes)

After an alarm fires:

1. Query dispatches:

```sql
SELECT id, "alarmType", "executionId", "orderId", "dispatchedAt", metadata
FROM plant_alarm_dispatches
WHERE "tenantId" = 'palos-de-lena'
ORDER BY "dispatchedAt" DESC
LIMIT 10;
```

2. Leave the triggering condition unchanged and wait for **two more cron cycles** (~2 minutes).
3. Expect **no new dispatch** for the same tenant + alarm type + execution/order within 30 minutes.
4. To test re-fire: either wait 30+ minutes or manually set the prior dispatch `dispatchedAt` older than 30 minutes, then wait for cron.

Dedup key: `tenantId` + `alarmType` + (`executionId` or `orderId`) + 30-minute window (`ALARM_DEDUP_WINDOW_MS`).

---

## Automated validation commands

Run from repo root after implementation is merged:

```bash
cd apps/api && pnpm prisma validate
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='plant|alarm|incident|worker|adapter'
pnpm --filter=@restopsiq/api run test:cov
```

Newman (incidents folder only):

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "Plant — Alarms & Incidents (MES-08)" \
  --bail
```

> Run MES Auth + Production Orders setup first so `workStationId`, `orderId`, and `executionId` are populated.

---

## Acceptance checklist

- [x] Postman: operator + supervisor MES login capture tokens
- [x] Postman: POST /api/plant/incidents
- [x] Postman: GET /api/plant/incidents with filter query params
- [x] Postman: PATCH /api/plant/incidents/:id/resolve
- [x] Postman: RBAC negative cases (operator list/resolve → 403)
- [x] Postman: tenant reference negative (invalid workStationId → 400)
- [x] Manual guide: WebSocket `incident:created` + `alarm:triggered`
- [x] Manual guide: three alarm rules + dedup + required services
- [x] Manual guide: validation commands documented

---

## Epic close

MES-08 manual testing package is complete. Do not start another ticket from this task.
