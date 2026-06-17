# RestOpsIQ Plant KDS (`@restopsiq/plant`)

Offline-first industrial KDS — Vite + React 18 + Capacitor 6.  
Spec: [`specs/restopsiq-plant-context.md`](../../specs/restopsiq-plant-context.md)

## Development

```bash
pnpm install
pnpm turbo dev --filter=@restopsiq/plant
```

Copy `.env.example` → `.env` and set `VITE_PLANT_API_URL` / `VITE_PLANT_WS_URL`.

## Scripts

| Script               | Description                                 |
| -------------------- | ------------------------------------------- |
| `pnpm test`          | Vitest unit tests (stores, services, hooks) |
| `pnpm build`         | Production static bundle + PWA              |
| `pnpm cap:sync`      | Sync `dist` to native projects              |
| `pnpm build:android` | Build + `cap sync android`                  |
| `pnpm report:bundle` | Gzip bundle size report (after build)       |

## Station ID provisioning

### Install-time (first boot)

```bash
# Web dev
http://localhost:5175/?stationId=EST-02

# Android (after cap add android)
npx cap run android -- --stationId=EST-02
```

### QR (supervisor)

Payload JSON: `{"stationId":"EST-02"}` — use `parseStationQrPayload` / setup screen (task 03/10).

Stored in `@capacitor/preferences` (native) + `localStorage` (web).

## Capacitor native

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant
npx cap add android   # once
npx cap sync
npx cap run android
```

`android/` and `ios/` are generated — do not edit by hand except documented Gradle hooks.

## Capgo live updates

1. Set `VITE_CAPGO_CHANNEL` (`staging` | `production`).
2. `CapacitorUpdater.notifyAppReady()` runs on bootstrap (`src/config/capgo.ts`).
3. Upload bundle after build (example):

```bash
npx @capgo/cli bundle upload --channel staging
```

Rollback: deploy previous bundle version on the same channel in Capgo dashboard.

## Android release APK

```bash
pnpm run build:android
cd android && ./gradlew assembleRelease
```

Sign with keystore via env vars (document in CI; never commit keys).

## Kiosk (Lock Task Mode)

Field technicians enable **Lock Task Mode** via MDM or device owner:

```bash
adb shell dpm set-lock-task-packages com.restopsiq.plant
```

Pin the app from device settings / dedicated launcher. See Android Enterprise docs for your tablet model.

## Wake lock

`useWakeLock` enables `@capacitor-community/keep-awake` while `session.store` has an active operator session.

## QA / Acceptance

See `tasks/app-plant/15-e2e-and-acceptance.md` (deferred until UI screens land).

## Deferred UI tasks

Operator/supervisor screens and routing: tasks **03**, **10**, **11**, **12**, **15**.
