# RestOpsIQ Plant KDS (`@restopsiq/plant`)

Offline-first industrial KDS — Vite + React 18 + Capacitor 6.  
Spec: [`specs/restopsiq-plant-context.md`](../../specs/restopsiq-plant-context.md)  
Epic nativo: [`tasks/app-plant/capacitor-native/00-epic-and-decisions.md`](../../tasks/app-plant/capacitor-native/00-epic-and-decisions.md)

## Prerrequisitos

| Herramienta                 | Uso                                        |
| --------------------------- | ------------------------------------------ |
| Node 20 + pnpm              | Monorepo                                   |
| Android Studio + SDK 29+    | Build/run Android                          |
| Mac + Xcode 15+ + CocoaPods | Build/run iOS (no compila desde iPad solo) |
| Cuenta Apple Developer      | TestFlight / dispositivos > 7 días         |

## Development (web)

```bash
pnpm install
pnpm turbo dev --filter=@restopsiq/plant
```

Copy `.env.example` → `.env` and set `VITE_PLANT_API_URL` / `VITE_PLANT_WS_URL`.

En navegador web los plugins nativos (cámara real, BLE) usan fallback o no están disponibles.

## Scripts

| Script                 | Description                    |
| ---------------------- | ------------------------------ |
| `pnpm test`            | Vitest unit tests              |
| `pnpm build`           | Production static bundle + PWA |
| `pnpm typecheck`       | TypeScript                     |
| `pnpm cap:sync`        | Sync `dist` to native projects |
| `pnpm build:android`   | Build + `cap sync android`     |
| `pnpm build:ios`       | Build + `cap sync ios` (Mac)   |
| `pnpm cap:add:android` | First-time `cap add android`   |
| `pnpm cap:add:ios`     | First-time `cap add ios` (Mac) |
| `pnpm report:bundle`   | Gzip bundle size report        |

## Capacitor native — primera vez

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant
pnpm cap:add:android   # once per machine
pnpm cap:add:ios       # once, Mac only
pnpm cap:sync
npx cap run android
# Mac:
npx cap run ios
```

`android/` and `ios/` are **generated** and gitignored — regenerate with `cap add` after clone.

### Build + sync (cada release)

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant && npx cap sync
```

Si `dist` está vacío, `cap sync` falla — correr build primero.

## Plugins nativos

| Plugin                              | Uso en app                            |
| ----------------------------------- | ------------------------------------- |
| `@capacitor/camera`                 | Foto en modal **Reportar novedad**    |
| `@capacitor-community/bluetooth-le` | Diagnóstico BLE (botón en app nativa) |
| `@capacitor/preferences`            | Station ID, preferencias              |
| `@capacitor-community/keep-awake`   | Sesión operario activa                |
| `@capgo/capacitor-updater`          | OTA bundles                           |

Permisos: [`docs/native-permissions.md`](docs/native-permissions.md)

BLE opcional: filtrar scan con `VITE_BLE_SCAN_SERVICE_UUID` (UUIDs separados por coma).

## Station ID provisioning

### Install-time (first boot)

```bash
# Web dev
http://localhost:5175/?stationId=EST-02

# Android (after cap add android)
npx cap run android -- --stationId=EST-02
```

### QR (supervisor)

Payload JSON: `{"stationId":"EST-02"}` — use `parseStationQrPayload` / setup screen.

Stored in `@capacitor/preferences` (native) + `localStorage` (web).

## Capgo live updates

1. Set `VITE_CAPGO_CHANNEL` (`staging` | `production`).
2. `CapacitorUpdater.notifyAppReady()` runs on bootstrap (`src/config/capgo.ts`).
3. Upload bundle after build:

```bash
npx @capgo/cli bundle upload --channel staging
```

## Android release APK

```bash
pnpm run build:android
cd android && ./gradlew assembleRelease
```

Sign with keystore via env vars (document in CI; never commit keys).

## iOS release

1. `pnpm run build:ios`
2. Open `ios/App/App.xcworkspace` in Xcode
3. Signing & Capabilities → Team
4. Product → Archive → TestFlight or Ad Hoc

**No se puede archivar IPA solo desde iPad** — hace falta Mac o CI macOS.

## Kiosk (Lock Task Mode)

```bash
adb shell dpm set-lock-task-packages com.restopsiq.plant
```

See Android Enterprise docs for your tablet model.

## Wake lock

`useWakeLock` enables `@capacitor-community/keep-awake` while `session.store` has an active operator session.

## Troubleshooting

| Problema                                | Solución                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `cap sync` falla                        | Ejecutar `pnpm build` antes                                                                           |
| BLE no lista dispositivos (Android 12+) | Verificar permisos BT + ubicación; revisar [`docs/native-permissions.md`](docs/native-permissions.md) |
| Cámara no abre                          | Permisos en Ajustes; reinstalar app para re-prompt                                                    |
| iOS “Untrusted Developer”               | Ajustes → General → VPN y gestión de dispositivos                                                     |
| iOS 16+ en iPad                         | Activar **Modo desarrollador**                                                                        |
| Plugins no funcionan en Safari          | Usar app Capacitor empaquetada, no PWA en browser                                                     |

## QA / Acceptance

Checklist dispositivo: [`tasks/app-plant/capacitor-native/05-device-validation.md`](../../tasks/app-plant/capacitor-native/05-device-validation.md)
