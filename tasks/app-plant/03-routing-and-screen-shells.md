# Task: Routing and screen shells

> **Status: DEFERRED (UI)** — Infra lista en `apps/plant` (`App.tsx` shell). Implementar cuando retomemos front.

**Depends on:** `01-scaffold-apps-plant.md`, `02-scss-industrial-preset.md`  
**Spec:** § Screen Architecture, Monorepo Structure

---

## Goal

Wire `react-router` with placeholder routes for all operator and supervisor screens; enforce operator vs supervisor route groups.

---

## Scope

### Operator routes (`/station/:stationId/...` or station from store)

| File                            | Route               | Shell behavior                           |
| ------------------------------- | ------------------- | ---------------------------------------- |
| `src/screens/Login.tsx`         | `/login`            | Fullscreen dark, title shows `stationId` |
| `src/screens/PhasePending.tsx`  | `/phase/pending`    | Waiting UI placeholder                   |
| `src/screens/PhaseActive.tsx`   | `/phase/active`     | Timer area placeholder                   |
| `src/screens/PhaseIncident.tsx` | overlay/modal route | Incident shell                           |
| `src/screens/PhaseComplete.tsx` | `/phase/complete`   | Numpad placeholder                       |

### Supervisor routes (`/supervisor/...`)

| File                             | Route                    |
| -------------------------------- | ------------------------ |
| `src/supervisor/Dashboard.tsx`   | `/supervisor`            |
| `src/supervisor/Orders.tsx`      | `/supervisor/orders`     |
| `src/supervisor/CreateOrder.tsx` | `/supervisor/orders/new` |

- `src/App.tsx` — router provider, layout split
- Guard: redirect to login if no session (stub until task 10)
- Guard: operator routes require resolved `stationId` (stub until task 05)

---

## Testing strategy

- **Unit (optional, light):** router renders correct shell for path — add in task 15 if deferred
- **Manual:** navigate all routes in dev

---

## Acceptance criteria

- [ ] All 8 screen files exist and render distinct placeholder content
- [ ] Screen transitions feel instant in dev (< 150ms perceived — no heavy suspense)
- [ ] Deep link `/login` works; supervisor paths under `/supervisor/*`
- [ ] No Next.js or SSR imports

---

## Files likely affected

- `apps/plant/src/App.tsx`
- `apps/plant/src/screens/*.tsx`
- `apps/plant/src/supervisor/*.tsx`

---

## Out of scope

- Business logic, WebSocket, API calls

---

## Validation commands

```bash
pnpm turbo dev --filter=@restopsiq/plant
# Manual: open each route in browser
```
