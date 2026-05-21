# Task: Offline sync queue (incidents + pending ops)

**Depends on:** `04-zustand-stores.md`, `06-pwa-offline-workbox.md`, `08-plant-socket-hook.md`  
**Spec:** § Queue Synchronization, Offline Capabilities, Recovery Requirements

---

## Goal

Persist pending API operations locally, retry with backoff, deduplicate on sync, and flush automatically when connectivity returns.

---

## Scope

### `src/services/offline-queue.service.ts`

- Queue item shape: `id`, `type`, `payload`, `createdAt`, `retryCount`, `idempotencyKey`
- Types (minimum): `incident.create`, `phase.complete` (extend as APIs land)
- Storage: IndexedDB or Capacitor Preferences + JSON blob (document choice)
- `connectivity.store` listener: on `isOnline` + successful ping → `flushQueue()`
- Dedup: same `idempotencyKey` not submitted twice after partial success
- Image blobs for incidents: compress before queue (target max width/quality documented)

### UI signal

- Badge or subtle indicator when `syncQueueCount > 0`
- Failed permanent errors → operator-visible message (supervisor escalation copy)

---

## Testing strategy

| Test                        | Type              |
| --------------------------- | ----------------- |
| Enqueue while offline       | **Unit**          |
| Flush on reconnect mock     | **Unit**          |
| Dedup idempotency           | **Unit**          |
| Retry backoff               | **Unit**          |
| End-to-end offline incident | **E2e** — task 15 |

---

## Acceptance criteria

- [ ] With WiFi off, submit incident → item in queue, UI confirms saved locally
- [ ] WiFi on → queue drains without duplicate POSTs (verify mock call count)
- [ ] `syncQueueCount` in connectivity store matches queue length
- [ ] Unit coverage ≥ 85% on queue service
- [ ] Spec recovery: pending incidents sync automatically after reconnect

---

## Files likely affected

- `apps/plant/src/services/offline-queue.service.ts`
- `apps/plant/src/services/offline-queue.service.test.ts`
- `apps/plant/src/stores/connectivity.store.ts`

---

## Out of scope

- Full Plant REST API contract (mock until backend ready)

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
# Manual: airplane mode on tablet → submit → reconnect
```
