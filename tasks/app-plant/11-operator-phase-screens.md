# Task: Operator phase screens (Pending → Active → Incident → Complete)

> **Status: DEFERRED (UI)** — Timer, socket, queue y camera deps instalados. Pendiente pantallas en `src/screens/`.

**Depends on:** `03-routing-and-screen-shells.md`, `04-zustand-stores.md`, `08-plant-socket-hook.md`, `09-offline-sync-queue.md`, `07-capacitor-native-shell.md`  
**Spec:** § PhasePending, PhaseActive, PhaseIncident, PhaseComplete

---

## Goal

Implement the full operator production flow with offline-safe timer, incident overlay with native camera, and completion numpad.

---

## Scope

### `PhasePending.tsx`

- Passive waiting UI; subscribe to `phase:status_changed` via hook
- Auto-navigate to Active when predecessor phase completes
- No ambiguous actions (read-only status copy)

### `PhaseActive.tsx`

- Large cronómetro bound to `timer.store` (INICIAR / PAUSAR)
- Actions: **NOVEDAD** → open incident overlay; **COMPLETAR** → navigate Complete
- Timer visible update latency < 100ms (CSS + 1s tick)
- Works offline — no WebSocket dependency for tick

### `PhaseIncident.tsx`

- Overlay/modal; max **4 interactions** to submit (spec)
- `@capacitor/camera` capture + optional note
- Offline → `offline-queue.service` enqueue
- Compress image before queue

### `PhaseComplete.tsx`

- Industrial numpad for quantity produced (decimal support)
- Confirm → API or queue offline → return to Pending/Login per workflow

---

## Testing strategy

| Area                                    | Type                                   |
| --------------------------------------- | -------------------------------------- |
| Timer UI start/pause                    | **Component unit** + store integration |
| Pending → Active on mocked socket event | **Unit**                               |
| Incident submit enqueues offline        | **Unit** — mock queue                  |
| Complete decimal validation             | **Unit**                               |
| Camera plugin                           | **Manual** on Android                  |
| 4-tap incident flow                     | **Manual** UX check                    |

---

## Acceptance criteria

- [ ] Timer runs with airplane mode on (no WS required)
- [ ] Pause/resume persists across app background (hydrate from task 04)
- [ ] Incident photo captured on device; queued offline if no network
- [ ] Complete quantity accepts decimals (e.g. `12.5`)
- [ ] WebSocket `phase:status_changed` moves Pending → Active without reload
- [ ] Unit tests for timer binding and offline incident enqueue pass

---

## Files likely affected

- `apps/plant/src/screens/PhasePending.tsx`
- `apps/plant/src/screens/PhaseActive.tsx`
- `apps/plant/src/screens/PhaseIncident.tsx`
- `apps/plant/src/screens/PhaseComplete.tsx`
- `apps/plant/src/components/ProductionNumpad/*`
- `apps/plant/src/screens/*.test.tsx` (critical paths)

---

## Out of scope

- Supervisor screens (task 12)
- Kiosk mode (task 14)

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
# Device: full phase cycle with offline incident mid-flight
```
