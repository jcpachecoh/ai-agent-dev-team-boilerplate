# Task 04: Permisos nativos (cámara y Bluetooth)

**Domain:** `[MOBILE]`  
**Depends on:** `01-capacitor-init-and-platforms.md`, `02-camera-plugin.md`, `03-bluetooth-plugin.md`

---

## Goal

Declarar y validar permisos en **AndroidManifest.xml** e **Info.plist** para cámara y Bluetooth, alineados con los plugins elegidos.

---

## Scope

### Android (`android/app/src/main/AndroidManifest.xml` vía Capacitor merge / documentación)

| Permiso                                                 | Uso                                                |
| ------------------------------------------------------- | -------------------------------------------------- |
| `CAMERA`                                                | Fotos de incidente                                 |
| `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` (API ≤32) | Galería si aplica                                  |
| `BLUETOOTH_SCAN`                                        | BLE scan (Android 12+)                             |
| `BLUETOOTH_CONNECT`                                     | BLE connect                                        |
| `ACCESS_FINE_LOCATION`                                  | Requerido por BLE scan en varias versiones Android |

- `android:usesPermissionFlags` según documentación del plugin BLE

### iOS (`ios/App/App/Info.plist`)

| Key                                     | Uso                                                              |
| --------------------------------------- | ---------------------------------------------------------------- |
| `NSCameraUsageDescription`              | Cámara incidentes                                                |
| `NSPhotoLibraryUsageDescription`        | Si se permite galería                                            |
| `NSBluetoothAlwaysUsageDescription`     | BLE                                                              |
| `NSBluetoothPeripheralUsageDescription` | Legacy si aplica                                                 |
| `UIBackgroundModes`                     | Solo si se requiere BT en background (evitar si no es necesario) |

- Textos en **español**, claros para operarios

### App

- Pedir permisos en runtime antes de scan/cámara (`requestPermissions` de cada plugin)
- UX: si denegado, mostrar instrucciones para abrir Ajustes

---

## Out of scope

- Permisos de micrófono, push, ubicación GPS de negocio
- Play/App Store privacy manifests completos (futuro)

---

## Files allowed

- Documentación en `apps/plant/README.md`
- Capacitor config hooks si el equipo usa `capacitor.config.ts` → `android` / `ios` sections
- Archivos plist/manifest **solo vía** scripts documentados o `cap sync` post-config (no commitear `android/` si política del repo es ignorarlos — entonces documentar pasos manuales post `cap add`)

---

## Files forbidden

- `packages/**`
- `apps/api/**`

---

## Acceptance criteria

- [ ] Primera apertura de cámara muestra diálogo de permiso en Android e iOS
- [ ] Primera apertura de BLE scan muestra permisos requeridos (BT + ubicación en Android si aplica)
- [ ] Denegar permiso muestra mensaje útil en la app
- [ ] README lista cada permiso y su justificación

---

## Validation commands

```bash
# Reinstalar app en dispositivo limpio (sin permisos previos)
cd apps/plant && pnpm build && npx cap sync
npx cap run android
npx cap run ios   # Mac + iPad
```

Manual: revocar permisos en Ajustes → volver a abrir flujo → verificar re-prompt o guía.
