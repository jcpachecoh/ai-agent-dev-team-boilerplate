# Task: Operator Login screen (PIN keypad)

> **Status: DEFERRED (UI)** — Stores + `station.service` listos. Pendiente `Login.tsx` + `PinKeypad`.

**Depends on:** `03-routing-and-screen-shells.md`, `04-zustand-stores.md`, `05-station-id-provisioning.md`  
**Spec:** § Login.tsx, Security (PIN auth), Accessibility (keypad 88×72)

---

## Goal

Industrial PIN login: giant numeric keypad, station-aware label, gloves-friendly interaction, session start.

---

## Scope

### `src/screens/Login.tsx`

- PIN input mask (4–6 digits per backend contract)
- Keypad keys **minimum 88×72px** (use SCSS preset)
- Show `stationId` from store (e.g. "Estación EST-02")
- Submit → Plant API auth → `session.store.login`
- Error states: wrong PIN, offline (allow offline login only if spec/backend supports — else clear message)
- Fullscreen dark layout

### Components

- `src/components/PinKeypad/PinKeypad.tsx`
- Optional `src/components/PinKeypad/PinKeypad.test.tsx`

---

## Testing strategy

| Test                          | Type                                             |
| ----------------------------- | ------------------------------------------------ |
| Keypad renders 0–9, backspace | **Component unit**                               |
| PIN length validation         | **Unit**                                         |
| Successful login calls store  | **Unit** — mock API                              |
| Touch target size             | **Manual** or snapshot + computed style in jsdom |
| Full login on device          | **Manual** — task 15                             |

---

## Acceptance criteria

- [ ] Tablet provisioned as `EST-02` opens directly to Login with station visible
- [ ] All keypad keys meet 88×72px (inspect in DevTools)
- [ ] Wrong PIN shows industrial-large error text (≥ 18px)
- [ ] `pnpm turbo test --filter=@restopsiq/plant` includes Login/Keypad tests passing
- [ ] On success, navigates to phase flow (pending/active per API state)

---

## Files likely affected

- `apps/plant/src/screens/Login.tsx`
- `apps/plant/src/components/PinKeypad/*`
- `apps/plant/src/services/auth.service.ts`

---

## Out of scope

- Phase screens (task 11)
- Wake lock (activates after login in task 14)

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo dev --filter=@restopsiq/plant
```
