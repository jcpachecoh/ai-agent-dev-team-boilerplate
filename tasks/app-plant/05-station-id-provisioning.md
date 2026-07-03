# Task: `stationId` provisioning and persistence

**Depends on:** `04-zustand-stores.md`, `07-capacitor-native-shell.md`  
**Spec:** § Station Identity, Acceptance Criteria (tablet boots to station login)

---

## Goal

Each tablet permanently knows its production station (`stationId`); survive restarts and offline periods; support install-time CLI and supervisor QR provisioning.

---

## Scope

### Persistence

- Read/write `stationId` via `@capacitor/preferences` (native) with `localStorage` fallback for web dev
- Hydrate `session.store` on app boot before rendering Login
- Login screen displays configured station (e.g. `EST-02`)

### Method 1 — Install-time

- Document and implement reading `--stationId=EST-02` from Capacitor/Android intent or build-time env injected at `cap run` / CI
- Script or Gradle hook to write Preferences on first launch if flag present

### Method 2 — QR (supervisor)

- `src/screens/StationSetup.tsx` or supervisor flow: scan QR JSON `{ "stationId": "EST-02" }`
- Use `@capacitor/camera` or browser QR library for supervisor tablet; operator tablet receives config via shared code path writing Preferences
- Restrict setup route behind supervisor PIN or hidden gesture (spec: supervisor-only configuration)

### Router

- If `stationId` missing → setup screen; if present → `/login` for that station

---

## Testing strategy

| Area                            | Type                                    |
| ------------------------------- | --------------------------------------- |
| `station.service.ts` read/write | **Unit** — mock Preferences API         |
| Boot hydrate → redirect         | **Unit** — render app with mocked store |
| QR parse validation             | **Unit** — valid/invalid JSON           |
| CLI intent on device            | **Manual** — task 14                    |

---

## Acceptance criteria

- [ ] After provisioning `EST-02`, force-close app → reopen → still `EST-02` on login header
- [ ] `stationId` unchanged when toggling airplane mode
- [ ] Invalid QR does not overwrite existing `stationId`
- [ ] Unit tests cover Preferences mock and hydrate path
- [ ] README section: `npx cap run android -- --stationId=EST-02`

---

## Files likely affected

- `apps/plant/src/services/station.service.ts`
- `apps/plant/src/screens/StationSetup.tsx` (or supervisor config UI)
- `apps/plant/src/stores/session.store.ts` (hydrate)
- `apps/plant/capacitor.config.ts`
- `apps/plant/README.md`

---

## Out of scope

- Backend station registry CRUD

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
# Device: cap run android with stationId flag, verify login label
```
