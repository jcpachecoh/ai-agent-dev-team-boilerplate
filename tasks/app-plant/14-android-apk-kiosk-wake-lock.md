# Task: Android APK build, kiosk mode, wake lock

**Depends on:** `07-capacitor-native-shell.md`, `11-operator-phase-screens.md` (wake lock hook done; full UX with task 11)  
**Spec:** § Native Android Requirements, Acceptance Criteria (APK, wake lock, kiosk)  
**Status:** ✅ Hook + README; APK build on technician device

---

## Goal

Produce release APK for Android 10+ tablets, enforce kiosk-friendly deployment, and keep screen awake during active operator sessions.

---

## Scope

### Release build

- Gradle release config: signing via env/keystore (document, no keys in repo)
- `pnpm` script: `build:android` → vite build + cap sync + assembleRelease
- Output artifact path documented for technicians

### Wake lock (`@capacitor-community/keep-awake`)

- Enable on `session.store` login / phase active
- Disable on logout and app background if policy requires battery safety (document choice — spec says release after logout)
- Recovery after app resume: re-enable if session still active

### Kiosk (Lock Task Mode)

- Document MDM / `adb` steps to pin app (Android Enterprise or device owner)
- Optional: detect kiosk unsupported → show technician warning
- Prevent accidental exit: disable back navigation to launcher where OS allows

### Bundle size check

- Report gzipped operator chunk size; target **~120KB** operator critical path (per architectural decision — measure and log in CI)

---

## Testing strategy

| Test                    | Type                                        |
| ----------------------- | ------------------------------------------- |
| Wake lock on login      | **Manual** device — screen stays on 10+ min |
| Wake lock off logout    | **Manual**                                  |
| APK installs Android 10 | **Manual** emulator API 29+                 |
| Lock Task               | **Manual** with MDM/adb                     |
| Bundle size             | **CI** script threshold warning             |

---

## Acceptance criteria

- [ ] Release APK installs on Android 10+ tablet
- [ ] Screen does not sleep during active operator session (wake lock verified)
- [ ] After logout, screen can sleep normally
- [ ] Kiosk documentation complete for field technicians
- [ ] Build pipeline produces signed or debug-release APK artifact
- [ ] Bundle report attached to build (operator entry chunk gzipped size logged)

---

## Files likely affected

- `apps/plant/android/` (Capacitor-generated, configure via `capacitor.config` / hooks only)
- `apps/plant/package.json` scripts
- `apps/plant/README.md` (kiosk + install)
- `apps/plant/src/hooks/useWakeLock.ts`
- `apps/plant/src/stores/session.store.ts` (integrate wake lock)

---

## Out of scope

- iOS App Store
- Play Store listing

---

## Validation commands

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant && npx cap sync android && cd android && ./gradlew assembleRelease
# Install APK; login; verify screen stays on
```
