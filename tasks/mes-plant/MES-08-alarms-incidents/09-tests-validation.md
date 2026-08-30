# MES-08 Task 09 — Tests & Validation

## Goal

Add unit/integration tests for alarm evaluation, dedup, cron enqueue, notification worker, incidents API, and WebSocket emits. Run epic validation gates including perf benchmark.

**Depends on:** Tasks 03–08.

---

## Scope

- Test specs under `apps/api/src/mes/plant/test/`.
- Benchmark test: 10 active OPs evaluated in < 500ms.
- Epic validation commands.

---

## Out of Scope

- E2E against production OneSignal.
- Postman collection (optional follow-up).
- `apps/plant/**` tests.
- `lint:fix`.

---

## Files allowed

- `apps/api/src/mes/plant/test/alarm-evaluator.service.spec.ts` — create
- `apps/api/src/mes/plant/test/alarm.repository.spec.ts` — create
- `apps/api/src/mes/plant/test/alarm.service.spec.ts` — create
- `apps/api/src/mes/plant/test/alarm-notification.service.spec.ts` — create
- `apps/api/src/mes/plant/test/incident.service.spec.ts` — create
- `apps/api/src/mes/plant/test/plant.controller.spec.ts` — extend (incident routes)
- `apps/api/src/mes/plant/test/plant.gateway.spec.ts` — extend (alarm + incident events)

---

## Files forbidden

- `apps/api/src/mes/auth/test/**` (unless import-only)
- `apps/api/prisma/**`
- `apps/plant/**`
- `postman/**` (unless explicit follow-up task)
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Alarm evaluator tests

| Scenario                               | Expected                  |
| -------------------------------------- | ------------------------- |
| IN_PROCESS, elapsed > 1.2× standard    | TIEMPO_EXCEDIDO candidate |
| IN_PROCESS, null startedAt             | no TIEMPO_EXCEDIDO        |
| IN_PROCESS, no active session > 15 min | FASE_SIN_OPERARIO         |
| Active session (`endedAt` null) recent | no FASE_SIN_OPERARIO      |
| Order near plannedEndAt                | OP_RETRASADA              |
| COMPLETED order                        | no OP_RETRASADA           |

### Dedup tests

| Scenario                          | Expected      |
| --------------------------------- | ------------- |
| First dispatch                    | enqueue job   |
| Same execution+type within 30 min | skip          |
| Same key after 30 min             | enqueue again |

### Cron tests

- Mock repository + evaluator + queue
- Assert `queue.add` called once per new alarm
- Assert no adapter/gateway calls in AlarmService

### Worker tests

- Mock `PlantEventsService`, push adapter, emergency adapter
- CRITICAL → emergency called; WARNING → emergency not called

### Incident tests

| Scenario      | Expected                    |
| ------------- | --------------------------- |
| POST valid    | 201 + emit incident:created |
| GET filters   | tenant-scoped query         |
| Resolve twice | 409 on second               |
| Wrong tenant  | 404                         |

### Gateway tests

- `emitAlarmTriggered` → `server.to().emit('alarm:triggered', ...)`
- `emitIncidentCreated` → `incident:created`

### Performance benchmark

```typescript
it('evaluates 10 active OPs in under 500ms', () => {
  const start = performance.now();
  // 10 executions + orders fixture
  evaluator.evaluateTenantAlarms(context, now);
  expect(performance.now() - start).toBeLessThan(500);
});
```

Run with mocked clock; no DB in benchmark (use in-memory rows).

### WS latency criterion (< 5s)

Document as **integration/manual**: cron interval 60s worst-case + worker immediate emit. Unit test proves worker emits synchronously on job process. Full 5s SLA validated in staging manual checklist — not CI blocker unless Redis integration test added.

---

## Acceptance criteria

- [x] All table scenarios covered.
- [x] Benchmark test passes locally.
- [x] `test:cov` branches ≥ 80% (project gate) — **80.12%** after worker/adapter/incident repository coverage tests.
- [x] No tests import `apps/plant`.
- [x] Epic checklist in `00-epic-decisions.md` updated to `[x]`.

---

## Validation commands

```bash
cd apps/api && pnpm prisma validate
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='plant|alarm|incident'
pnpm --filter=@restopsiq/api run test:cov
```

Manual (optional):

- Redis running; trigger cron with seeded IN_PROCESS execution + past startedAt; observe WS client receives `alarm:triggered`.

**Manual testing package (Task 10):** see [`10-manual-testing.md`](./10-manual-testing.md) and Postman folder **Plant — Alarms & Incidents (MES-08)**.

---

## Epic close

After this task, mark `tasks/mes-plant/MES-08-alarms-incidents/00-epic-decisions.md` checklist complete and stop — do not start MES-06/07/09 follow-ups without new ticket.
