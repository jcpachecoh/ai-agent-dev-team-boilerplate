# Task: Supervisor screens (Dashboard, Orders, CreateOrder)

> **Status: DEFERRED (UI)** — `usePlantSocket` listo. Pendiente `src/supervisor/*`.

**Depends on:** `03-routing-and-screen-shells.md`, `08-plant-socket-hook.md`  
**Spec:** § Supervisor Screens, Dashboard/Orders/CreateOrder requirements

---

## Goal

Supervisor-facing UI for real-time plant map, OP list, and OP creation with auto-generated phases.

---

## Scope

### `Dashboard.tsx`

- Plant map / station grid with live states from WebSocket
- `alarm:triggered` visualization (sound optional — document if out of scope)
- `operator:connected` indicators
- No full page reload on events — state-driven updates only

### `Orders.tsx`

- List active production orders (OPs)
- Phase progress per OP
- Filters: active / completed / station (as API provides)

### `CreateOrder.tsx`

- Form: product/SKU, quantity, template → **auto-generated phases** from API
- Client-side validation before submit
- Success → redirect to Orders with new OP visible

### Shared

- `src/services/orders.service.ts`, `src/services/plant-api.service.ts`
- May run in browser on desktop or tablet — lighter touch targets than operator OK

---

## Testing strategy

| Test                                          | Type                                 |
| --------------------------------------------- | ------------------------------------ |
| Dashboard renders stations from mock WS state | **Unit**                             |
| CreateOrder validation rules                  | **Unit**                             |
| Orders list loading/error                     | **Unit** — mock HTTP                 |
| Live alarm animation                          | **Manual**                           |
| Real API                                      | **Integration** — staging in task 15 |

---

## Acceptance criteria

- [ ] Dashboard updates station color/state on `phase:status_changed` without reload
- [ ] Alarm banner appears on `alarm:triggered` within 1s of event
- [ ] CreateOrder rejects invalid form; successful create shows in Orders list
- [ ] Unit tests for validation and WS-driven dashboard slice pass
- [ ] Supervisor can open QR/setup flow for `stationId` provisioning (links task 05)

---

## Files likely affected

- `apps/plant/src/supervisor/Dashboard.tsx`
- `apps/plant/src/supervisor/Orders.tsx`
- `apps/plant/src/supervisor/CreateOrder.tsx`
- `apps/plant/src/services/orders.service.ts`
- `apps/plant/src/supervisor/*.test.tsx`

---

## Out of scope

- Operator PIN screens
- Android kiosk (supervisor may use browser)

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo dev --filter=@restopsiq/plant
```
