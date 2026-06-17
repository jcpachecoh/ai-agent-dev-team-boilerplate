# MES-08 Task 04 — Alarm Repository

## Goal

Implement Prisma data access for alarm scans, dedup lookups, and dispatch persistence.

**Depends on:** Tasks 01–03.  
**Blocks:** Tasks 05–06.

---

## Scope

- Extend `plant.repository.ts` OR create `alarm.repository.ts` implementing `IAlarmRepository`.
- Tenant-safe queries for active executions/orders.
- Dedup: find latest dispatch within 30 minutes; insert dispatch record.

---

## Out of Scope

- Evaluation logic (task 03).
- Cron/worker (tasks 05–06).
- Incident repository (task 07 may share plant.repository or separate).

---

## Files allowed

- `apps/api/src/mes/plant/repository/alarm.repository.ts` — create
- `apps/api/src/mes/plant/repository/plant.repository.ts` — extend only if consolidating
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend
- `apps/api/src/mes/plant/test/alarm.repository.spec.ts` — create (allowed if task asks tests; else defer to 09)

---

## Files forbidden

- `apps/api/prisma/schema.prisma` (done in task 01)
- `apps/api/src/mes/plant/controller/**`
- `apps/api/src/mes/auth/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/plant/**`

---

## Implementation notes

### Active execution scan query

Filter:

- `tenantId`
- `status IN ('IN_PROCESS', 'READY')` — **only `IN_PROCESS` evaluated** for TIEMPO/FASE rules; query may fetch IN_PROCESS only
- Include `phase.standardMinutes`, `execution.startedAt`
- Left join active sessions: `operatorSession.endedAt IS NULL AND phaseExecutionId = execution.id`
- Aggregate earliest active session `startedAt` per execution

### Delayed order scan

Filter:

- `tenantId`
- `status NOT IN ('COMPLETED', 'CANCELLED')`
- `plannedEndAt` within next 30 minutes OR already past `plannedEndAt` (configurable — match ticket)

### Dedup lookup

```typescript
findLatestDispatch(tenantId, { alarmType, executionId?, orderId? }, since: Date): Promise<PlantAlarmDispatch | null>
```

`since = now - 30 minutes`. If row exists → skip enqueue.

### Create dispatch

Insert `PlantAlarmDispatch` **before** enqueue (or in same transaction as job id) so dedup works if worker fails.

### Tenant safety

Every query MUST filter `tenantId`. Repository must not throw HTTP exceptions.

---

## Acceptance criteria

- [ ] Repository implements `IAlarmRepository` from task 02.
- [ ] Active session uses `endedAt IS NULL` (D2).
- [ ] Dedup query uses 30-minute window (D4/D5).
- [ ] Repository unit tests mock Prisma (task 09 or this task).

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=alarm.repository
```
