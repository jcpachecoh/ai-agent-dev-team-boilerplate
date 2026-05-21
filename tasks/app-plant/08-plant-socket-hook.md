# Task: `usePlantSocket` — real-time WebSocket

**Depends on:** `04-zustand-stores.md`, `06-pwa-offline-workbox.md`  
**Spec:** § Real-Time Architecture, Events, Reliability (reconnect)

---

## Goal

Centralize Socket.io client connection, auto-reconnect, and event dispatch for plant operations.

---

## Scope

### `src/hooks/usePlantSocket.ts`

- Connect to `VITE_PLANT_WS_URL` with `stationId` / tenant auth from `session.store`
- Subscribe and handle:
  - `phase:status_changed` → update phase route/state
  - `alarm:triggered` → supervisor alarm state
  - `incident:created` → broadcast refresh
  - `operator:connected` → supervisor presence
- Exponential backoff reconnect; do not block timer store (spec constraint)
- Integrate `connectivity.store`: mark degraded when socket down but device online

### `src/services/plant-socket.service.ts` (optional thin wrapper for testability)

---

## Testing strategy

| Test                        | Type                                                         |
| --------------------------- | ------------------------------------------------------------ |
| Event handlers update state | **Unit** — mock `socket.io-client` with `vi.mock`            |
| Reconnect backoff           | **Unit** — fake timers                                       |
| Timer independence          | **Unit** — assert timer store ticks when socket disconnected |
| Live server                 | **Integration (optional)** — staging WS; manual in task 15   |

---

## Acceptance criteria

- [ ] Unit tests: `phase:status_changed` triggers expected store/route callback
- [ ] On disconnect, app reconnects within documented max delay without full page reload
- [ ] Operator timer continues when socket is offline (regression test from task 04)
- [ ] Supervisor dashboard hook receives `alarm:triggered` payload

---

## Files likely affected

- `apps/plant/src/hooks/usePlantSocket.ts`
- `apps/plant/src/hooks/usePlantSocket.test.ts`
- `apps/plant/src/services/plant-socket.service.ts`
- `apps/plant/package.json` (`socket.io-client`)

---

## Out of scope

- NestJS gateway implementation (backend separate repo/task)
- Offline incident queue (task 09)

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo dev --filter=@restopsiq/plant
# Optional: point VITE_PLANT_WS_URL to staging
```
