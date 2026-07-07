# MES-08 Task 03 — Alarm Evaluator (Pure Logic)

## Goal

Implement stateless alarm rule evaluation with unit-testable pure functions.

**Depends on:** Task 02.  
**Blocks:** Tasks 04–06.

---

## Scope

- `apps/api/src/mes/plant/service/alarm-evaluator.service.ts` (or `alarm/alarm-evaluator.service.ts`)
- Pure helpers for each alarm type per D1–D2.
- Unit tests in task 09 (spec file may be stubbed here if task 09 owns all tests — prefer tests in 09 only per SDD; this task implements service only).

---

## Out of Scope

- Prisma access (task 04).
- Cron / BullMQ (tasks 05–06).
- HTTP routes.
- OneSignal / emergency calls.

---

## Files allowed

- `apps/api/src/mes/plant/service/alarm-evaluator.service.ts` — create
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend if needed

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/api/src/mes/plant/repository/**`
- `apps/api/src/mes/plant/controller/**`
- `apps/api/src/mes/auth/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/plant/**`

---

## Implementation notes

### Input row shape (from repository)

```typescript
type ExecutionAlarmRow = {
  executionId: string;
  orderId: string;
  tenantId: string;
  workStationId: string;
  status: PhaseExecutionStatus;
  startedAt: Date | null;
  standardMinutes: number; // from phase
  activeSessionStartedAt: Date | null; // earliest endedAt IS NULL session for execution
};
```

### Rule: TIEMPO_EXCEDIDO

- Preconditions: `status === IN_PROCESS`, `startedAt != null`
- Trigger: `now - startedAt > standardMinutes * 1.2 * 60_000` (minutes → ms)
- If `startedAt` is null while `IN_PROCESS`, skip (data inconsistency — no alarm)

### Rule: FASE_SIN_OPERARIO

- Preconditions: `status === IN_PROCESS`
- Active session: exists `OperatorSession` with `phaseExecutionId = executionId` AND `endedAt IS NULL`
- Trigger: no active session OR (`now - lastActiveSessionStartedAt > 15 minutes`)
- Use `activeSessionStartedAt` from repository join; if no session ever, treat as "sin operario" immediately after 15 min IN_PROCESS (document: use `startedAt` or execution `createdAt` as fallback anchor — **prefer `startedAt`**)

### Rule: OP_RETRASADA

- Input: orders where `status NOT IN (COMPLETED, CANCELLED)`
- Trigger: `plannedEndAt - now < 30 minutes` AND `plannedEndAt > now` (still before deadline) OR `now > plannedEndAt` (already late — still alarm once per dedup window)
- `executionId` null in candidate; `orderId` required

### Output: `AlarmCandidate`

```typescript
{
  alarmType: PlantAlarmType;
  severity: AlarmSeverity;
  tenantId: string;
  executionId?: string;
  orderId?: string;
  workStationId: string;
  message: string;
}
```

Severity defaults per main spec.

---

## Acceptance criteria

- [ ] Three rules implemented exactly as ticket + D1/D2.
- [ ] Evaluator has **no** Prisma/database imports.
- [ ] Edge cases documented in tests (task 09): null startedAt, no sessions, completed orders excluded.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=alarm-evaluator
```
