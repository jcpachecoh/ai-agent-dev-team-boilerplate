# MES-08 Task 06 — Notification Worker & Adapters

## Goal

Process BullMQ alarm jobs: emit WebSocket `alarm:triggered`, invoke OneSignal adapter, invoke emergency adapter for CRITICAL severity.

**Depends on:** Tasks 05, 08 (gateway emit method — implement gateway in 08 first or stub inject).  
**Blocks:** Task 09.

---

## Scope

- BullMQ `Worker` consuming `plant-alarm-notifications`.
- `StubOneSignalAdapter` + `StubEmergencyAlertAdapter` (D8).
- `AlarmNotificationService` orchestrating adapters + events service.
- Optional: `apps/api/src/mes/plant/worker/alarm-notification.worker.ts`

---

## Out of Scope

- Cron enqueue (task 05).
- Real OneSignal SDK / HTTP (stub only in MES-08).
- Incidents API.
- Email notifications.

---

## Files allowed

- `apps/api/src/mes/plant/service/alarm-notification.service.ts` — create
- `apps/api/src/mes/plant/adapters/stub-onesignal.adapter.ts` — create
- `apps/api/src/mes/plant/adapters/stub-emergency.adapter.ts` — create
- `apps/api/src/mes/plant/adapters/alarm-push.adapter.interface.ts` — create
- `apps/api/src/mes/plant/worker/alarm-notification.worker.ts` — create (optional)
- `apps/api/src/mes/plant/plant.module.ts` — register worker on module init (or document separate process)
- `apps/api/package.json` — only if task 05 missed bullmq

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/api/src/mes/auth/**`
- `apps/plant/**`
- `postman/**`

---

## Implementation notes

### Worker flow

On job `PlantAlarmNotificationJob`:

1. Call `PlantEventsService.emitAlarmTriggered(tenantId, payload)` (task 08)
2. Call `IAlarmPushAdapter.send({ tenantId, severity, message, ... })`
3. If `severity === CRITICAL`, call `IEmergencyAlertAdapter.notify({ tenantId, ... })`
4. On success: `AlarmRepository.markDispatchSent(tenantId, dispatchId)` — stores `notificationStatus: SENT` in dispatch `metadata`
5. On failure: `AlarmRepository.markDispatchFailed(tenantId, dispatchId, errorMessage)` — stores `notificationStatus: FAILED` in dispatch `metadata`, then rethrow for BullMQ retry

### Stub OneSignal adapter

- Log structured message at `debug`/`log` level
- No network
- Interface allows future real impl reading `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY`

### Stub emergency adapter

- Read optional env `PLANT_EMERGENCY_WEBHOOK_URL` — if unset, no-op
- If set in dev, may `fetch` POST (mock in tests)

### Tenant emergency config (future)

Document placeholder: `tenantId → webhook URL` from env JSON or DB — **stub uses single env var** in MES-08.

### Worker lifecycle

- Start worker in `PlantModule.onModuleInit` when `PLANT_ALARM_WORKER_ENABLED !== 'false'`
- Graceful shutdown on `onModuleDestroy`
- Reference `packages/email/src/email.worker.ts` for patterns — do not share connections with email queue

---

## Acceptance criteria

- [x] Worker processes job and calls WS emit + both adapters.
- [x] CRITICAL triggers emergency adapter; WARNING/INFO skip emergency.
- [x] Adapters swappable via DI tokens.
- [x] Successful notification marks dispatch metadata as SENT.
- [x] Failed notification marks dispatch metadata as FAILED.
- [x] Tests cover SENT, CRITICAL emergency path, and FAILED failure path.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=alarm-notification
```
