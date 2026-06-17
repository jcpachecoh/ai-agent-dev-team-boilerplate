# MES-08 Task 05 — Cron & BullMQ Enqueue

## Goal

Implement `AlarmService` scheduled job that evaluates alarms per tenant and enqueues BullMQ notification jobs without blocking the event loop.

**Depends on:** Tasks 03–04.  
**Blocks:** Task 06.

---

## Scope

- `AlarmService` with `@Cron` or `@Interval(60000)`.
- BullMQ `Queue` for `plant-alarm-notifications`.
- Wire `ScheduleModule` in `PlantModule`.
- Enqueue job payload from task 02 after dedup passes.

---

## Out of Scope

- Worker processor (task 06).
- OneSignal / WS emit in cron.
- Incidents API (task 07).
- Separate worker entrypoint process (optional follow-up — MVP may use Nest `@Processor` if BullMQ Nest integration added, or inline worker provider).

---

## Files allowed

- `apps/api/src/mes/plant/service/alarm.service.ts` — create
- `apps/api/src/mes/plant/repository/alarm.repository.ts` — extend with `findActiveAlarmTenantIds`
- `apps/api/src/mes/plant/test/alarm.service.spec.ts` — service tests
- `apps/api/src/mes/plant/plant.module.ts` — register ScheduleModule, AlarmService, Queue provider
- `apps/api/src/app.module.ts` — **only if** ScheduleModule must be root-imported (prefer PlantModule import)
- `apps/api/package.json` — add `@nestjs/schedule`, `bullmq` (this task only)
- `pnpm-lock.yaml` — updated by install (this task only)

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/api/src/mes/auth/**` (logic changes)
- `apps/plant/**`
- `scripts/validate-structure.js`

---

## Implementation notes

### Cron behavior

Every 60 seconds:

1. Load distinct `tenantId` values via `AlarmRepository.findActiveAlarmTenantIds(now)` (executions IN_PROCESS or orders near deadline).
2. For each tenant:
   - Fetch rows via `AlarmRepository` scan methods
   - Run `AlarmEvaluator`
   - For each candidate: if dedup allows → `createDispatch` + `queue.add(job)`
3. Must complete **10 OP benchmark** path in < 500ms (task 09) — avoid N+1 queries; batch fetches.

### BullMQ queue

- Name: `plant-alarm-notifications`
- Redis: `process.env.REDIS_URL ?? 'redis://localhost:6379'`
- Job options: `{ removeOnComplete: 100, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }`
- **Do not** reuse `@restopsiq/email` queue

### Failure handling

- Cron try/catch per tenant — one tenant failure must not stop others.
- Log errors; no HTTP exceptions from cron.

### Dependencies install (task 05 only)

```bash
pnpm --filter=@restopsiq/api add @nestjs/schedule bullmq
```

Import `ScheduleModule.forRoot()` once (AppModule or PlantModule per Nest docs).

---

## Acceptance criteria

- [ ] Cron runs every 60s (configurable constant).
- [ ] Tenant discovery via `AlarmRepository.findActiveAlarmTenantIds` (AlarmService does not use PrismaService directly).
- [ ] Evaluator + dedup invoked; jobs enqueued on new alarms only.
- [ ] No external notification calls in cron.
- [ ] `node scripts/validate-structure.js` passes.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=alarm.service
```
