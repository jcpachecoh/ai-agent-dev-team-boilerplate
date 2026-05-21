# Task: Zustand stores (timer, session, connectivity) + unit tests

**Depends on:** `01-scaffold-apps-plant.md`  
**Spec:** § State Management, Offline-First Requirements, Performance (timer latency)

---

## Goal

Implement the three global Zustand stores with Vitest coverage for offline timer behavior, session/station persistence hooks, and connectivity ping cadence.

---

## Scope

### `src/stores/timer.store.ts`

- `setInterval`-based elapsed time; survives tick without network
- Persist elapsed snapshot to `localStorage` or IndexedDB (choose one, document)
- Actions: `start`, `pause`, `resume`, `reset`, `hydrate`
- Drift tolerance documented: target < 1s/hour (test with fake timers)

### `src/stores/session.store.ts`

- `operatorId`, `operatorName`, `stationId`, `isAuthenticated`, `sessionStartedAt`
- Actions: `login`, `logout`, `setStationId`
- Prepare integration with `@capacitor/preferences` in task 05 (interface only)

### `src/stores/connectivity.store.ts`

- `isOnline`, `lastPingAt`, `latencyMs`, `syncQueueCount`
- Ping every **10 seconds** when online (match POS offline pattern per spec)
- Exponential backoff on failed ping (configurable max interval)

### Vitest setup

- `vitest`, `@testing-library/react` (if needed), `jsdom`, fake timers
- Scripts: `test`, `test:watch`, `test:cov`
- Register `test` in Turbo for `@restopsiq/plant`

---

## Testing strategy

| Store                | Test type | Cases                                                                             |
| -------------------- | --------- | --------------------------------------------------------------------------------- |
| `timer.store`        | **Unit**  | start/pause/resume; elapsed increments with fake timers; hydrate restores elapsed |
| `session.store`      | **Unit**  | login/logout clears operator; setStationId                                        |
| `connectivity.store` | **Unit**  | ping interval 10s; offline flips `isOnline`; backoff caps                         |

**Not integration** with real network — mock `fetch` / `navigator.onLine`.

---

## Acceptance criteria

- [ ] `pnpm turbo test --filter=@restopsiq/plant` exits 0
- [ ] Timer tests prove increment without mocking WebSocket
- [ ] Connectivity store schedules ping every 10s (assert call count with fake timers)
- [ ] Line coverage ≥ 80% on `src/stores/*.ts`

---

## Files likely affected

- `apps/plant/src/stores/timer.store.ts`
- `apps/plant/src/stores/session.store.ts`
- `apps/plant/src/stores/connectivity.store.ts`
- `apps/plant/src/stores/*.test.ts`
- `apps/plant/vitest.config.ts` or `vite.config.ts` test block
- `apps/plant/package.json`

---

## Out of scope

- Capacitor Preferences persistence (task 05)
- WebSocket (task 08)

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo test:cov --filter=@restopsiq/plant
```
