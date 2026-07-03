# MES-08 Task 01 — Schema & Migration

## Goal

Add Prisma models and migration for alarm dedup dispatch audit, manual production incidents, and `PhaseExecution.startedAt`.

**Depends on:** Task 00.  
**Blocks:** Tasks 02–09.

---

## Scope

- Update `apps/api/prisma/schema.prisma` only (MES-08 models + `startedAt`).
- Create one migration SQL file.
- Run `prisma format` + `prisma validate` (no `migrate dev` unless explicitly instructed).

---

## Out of Scope

- Application code under `apps/api/src/`.
- Seed data for incidents/alarms (optional note only).
- `OperatorSession.isActive` column (D2: use `endedAt`).
- `PlantOperator` table.
- Photo binary storage tables.

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/*/migration.sql` (new migration only)

---

## Files forbidden

- `apps/api/src/**`
- `apps/api/prisma/seed.ts` (unless follow-up task)
- `package.json` / `pnpm-lock.yaml`
- `apps/plant/**`

---

## Implementation notes

### `PhaseExecution` alteration

Add nullable field:

```prisma
startedAt DateTime?
```

Index optional: `@@index([tenantId, status, startedAt])` if query plans need it (document in migration).

**Population rule (document only — runtime ticket):** set `startedAt = now()` when status transitions to `IN_PROCESS`; leave null for `PENDING`/`READY`.

### `PlantAlarmType` enum (suggested)

- `TIEMPO_EXCEDIDO`
- `FASE_SIN_OPERARIO`
- `OP_RETRASADA`

### `AlarmSeverity` enum

- `INFO`
- `WARNING`
- `CRITICAL`

### `PlantAlarmDispatch` model (dedup + audit)

Suggested shape:

| Field          | Type           | Notes                     |
| -------------- | -------------- | ------------------------- |
| `id`           | cuid           | PK                        |
| `tenantId`     | String         |                           |
| `alarmType`    | PlantAlarmType |                           |
| `executionId`  | String?        | null for OP_RETRASADA     |
| `orderId`      | String?        | required for OP_RETRASADA |
| `severity`     | AlarmSeverity  | snapshot at dispatch      |
| `dispatchedAt` | DateTime       | default now               |
| `message`      | String         | human-readable            |
| `metadata`     | Json?          | optional extras           |

**Dedup unique constraint (30 min window enforced in service):**

- Index: `@@index([tenantId, alarmType, executionId, dispatchedAt])`
- Index: `@@index([tenantId, alarmType, orderId, dispatchedAt])`

Service checks latest dispatch within 30 minutes — table stores history for audit.

### `ProductionIncident` model (manual)

Separate from alarms.

| Field            | Type              | Notes                                  |
| ---------------- | ----------------- | -------------------------------------- |
| `id`             | cuid              |                                        |
| `tenantId`       | String            |                                        |
| `orderId`        | String?           | FK ProductionOrder optional            |
| `executionId`    | String?           | FK PhaseExecution optional             |
| `workStationId`  | String            | FK WorkStation                         |
| `operatorUserId` | String            | FK OperationalUser (reporter)          |
| `type`           | IncidentType enum | e.g. QUALITY, SAFETY, EQUIPMENT, OTHER |
| `severity`       | AlarmSeverity     |                                        |
| `description`    | String            |                                        |
| `photoUrl`       | String?           | optional URL string only               |
| `resolvedAt`     | DateTime?         |                                        |
| `resolvedBy`     | String?           | supervisor OperationalUser id          |
| `resolution`     | String?           |                                        |
| `createdAt`      | DateTime          |                                        |

**No relation** from `PlantAlarmDispatch` to `ProductionIncident`.

### Relations

- `ProductionIncident` → `ProductionOrder`, `PhaseExecution`, `WorkStation`, `OperationalUser` (reporter + resolver optional)
- Do **not** add `incidents` array on `OperatorSession` (MES-06 draft conflict)

---

## Acceptance criteria

- [ ] `PhaseExecution.startedAt` present in schema.
- [ ] `PlantAlarmDispatch` + `ProductionIncident` models added with tenant indexes.
- [ ] Alarm and incident enums defined.
- [ ] Migration SQL matches schema only for MES-08 tables/columns.
- [ ] `pnpm prisma validate` passes.
- [ ] `pnpm prisma format` applied.

---

## Validation commands

```bash
cd apps/api && pnpm prisma format
cd apps/api && pnpm prisma validate
# Do NOT run prisma migrate dev unless user instructs
```
