# Task: Capacitor 6 shell + native plugins

**Depends on:** `01-scaffold-apps-plant.md`, `06-pwa-offline-workbox.md`  
**Spec:** § Native Android Requirements, Technology Stack (Capacitor plugins)

---

## Goal

Wrap the Vite build in Capacitor 6 for Android (primary) and iOS (optional); wire core plugins used by operator flows.

---

## Scope

### Capacitor setup

- `npx cap init` / sync workflow documented
- `android/` and `ios/` generated — **do not hand-edit** except documented hooks
- `capacitor.config.ts`: `webDir: dist`, app id `com.restopsiq.plant`, Android min SDK 29 (Android 10+)

### Plugins

| Package                           | Use                                   |
| --------------------------------- | ------------------------------------- |
| `@capacitor/preferences`          | `stationId`, session tokens (task 05) |
| `@capacitor/camera`               | Incident photos (task 11)             |
| `@capacitor-community/keep-awake` | Active session wake lock (task 14)    |

- Platform check helpers: `src/utils/platform.ts` (`isNative`, `isAndroid`)

---

## Testing strategy

- **Build / manual** — `cap sync`, `cap run android` on emulator or device
- **No Jest unit tests** for generated `android/` tree
- Plugin smoke: Preferences round-trip script in dev menu

---

## Acceptance criteria

- [ ] `pnpm turbo build --filter=@restopsiq/plant && npx cap sync` succeeds
- [ ] `npx cap run android` launches WebView with latest `dist`
- [ ] Preferences plugin read/write works on device
- [ ] Camera permission prompt appears when incident flow requests photo (stub OK)
- [ ] iOS project generates if team needs iPad supervisor (optional smoke)

---

## Files likely affected

- `apps/plant/capacitor.config.ts`
- `apps/plant/package.json`
- `apps/plant/android/` (generated)
- `apps/plant/ios/` (generated)
- `apps/plant/src/utils/platform.ts`

---

## Out of scope

- Kiosk Lock Task Mode (task 14)
- Capgo (task 13)
- Play Store release pipeline

---

## Validation commands

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant && npx cap sync && npx cap run android
```
