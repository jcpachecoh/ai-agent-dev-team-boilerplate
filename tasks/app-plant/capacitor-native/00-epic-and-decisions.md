# Epic: Planta nativa — Capacitor, cámara y Bluetooth

**App:** `apps/plant` (`@restopsiq/plant`)  
**Spec base:** [`specs/restopsiq-plant-context.md`](../../../specs/restopsiq-plant-context.md)  
**Relacionado:** tareas existentes `07-capacitor-native-shell.md`, `14-android-apk-kiosk-wake-lock.md`

---

## Estado actual (baseline)

| Ítem                                                                        | Estado                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------- |
| `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios` | ✅ En `package.json`                            |
| `capacitor.config.ts` (`webDir: dist`, `com.restopsiq.plant`)               | ✅                                              |
| `@capacitor/camera`                                                         | ✅ Integrado en modal reporte novedad           |
| `@capacitor-community/bluetooth-le`                                         | ✅ Diagnóstico scan/connect                     |
| `android/` y `ios/`                                                         | ⚠️ Generados localmente (`cap add`); gitignored |
| Bluetooth                                                                   | ✅ BLE genérico (D1 cerrada)                    |

Este epic completa la capa nativa: plataformas, permisos, cámara en incidentes, Bluetooth y validación en dispositivo.

---

## Goal

La app **Planta** corre como app nativa en **Android e iOS**, con **cámara** operativa en flujo de incidentes y **Bluetooth** (scan/connect) según el hardware acordado con operaciones.

---

## Decisiones bloqueantes (confirmar antes de task 03)

| #   | Pregunta                                        | Opciones                                                                              | Impacto                                        |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------- |
| D1  | ¿Qué dispositivo Bluetooth?                     | **A) BLE genérico** — `@capacitor-community/bluetooth-le` ✅ **Cerrada (2026-06-17)** |
|     |                                                 | **B)** Impresora térmica clásica (ESC/POS, SPP)                                       | Plugin distinto o bridge nativo; Android ≠ iOS |
|     |                                                 | **C)** Ambos                                                                          | Dos tareas / dos adapters                      |
| D2  | ¿Modelo/marca del hardware en planta?           | Ej. Zebra, Sunmi, genérico BLE                                                        | Define pairing y pruebas QA                    |
| D3  | ¿Supervisor en iPad o solo operario en Android? | iPad supervisor vs tablet Android operario                                            | Prioridad iOS vs Android en QA                 |

**Recomendación técnica:** cerrar D1 con operaciones antes de implementar task 03. Si aún no hay hardware, implementar **adapter interface** + mock web + BLE como default.

---

## Orden de tareas

| #   | Task                                     | Depende de             | Entregable                                      |
| --- | ---------------------------------------- | ---------------------- | ----------------------------------------------- |
| 00  | Epic y decisiones                        | —                      | Este archivo                                    |
| 01  | Init Capacitor + plataformas Android/iOS | 01-scaffold (✅)       | `android/`, `ios/` generados y sync documentado |
| 02  | Plugin cámara + flujo incidente          | 01, MES-08 incident UI | Foto nativa + cola offline                      |
| 03  | Plugin Bluetooth                         | 01, **D1 cerrada**     | Scan/connect según BLE o impresora              |
| 04  | Permisos nativos                         | 01, 02, 03             | `Info.plist`, `AndroidManifest.xml`             |
| 05  | Validación en dispositivo físico         | 01–04                  | Checklist QA Android + iOS                      |
| 06  | README build/release                     | 01–05                  | Documentación para el equipo                    |

---

## Criterios de aceptación (epic)

- [ ] App Planta abre en WebView nativo en **Android 10+** y **iOS** (iPad/iPhone según alcance).
- [ ] Cámara captura foto en flujo de incidente dentro de la app nativa.
- [ ] Bluetooth: scan y connect al menos un dispositivo de referencia acordado (o mock documentado si hardware pendiente).
- [ ] Permisos de cámara y Bluetooth declarados y probados en ambas plataformas.
- [ ] README de `apps/plant` con pasos de build, sync, run y release.

---

## Qué necesitas para probar con un iPad

### Lo que el iPad **sí** permite

- Ejecutar la app **una vez instalada** (IPA firmada).
- Probar cámara, Bluetooth (si el periférico es compatible con iOS), touch, orientación, permisos.
- Recibir builds vía **TestFlight** (equipo) sin cable cada vez.

### Lo que el iPad **no** permite solo

- **Compilar** el proyecto iOS: hace falta un **Mac con Xcode** (no se puede generar IPA solo desde el iPad).
- **Simular** Android en el iPad (Android APK no corre en iPad).

### Checklist de hardware/software para QA iOS

| Requisito                            | Obligatorio                                        | Notas                                         |
| ------------------------------------ | -------------------------------------------------- | --------------------------------------------- |
| Mac (Apple Silicon o Intel)          | ✅ Para build local                                | macOS + Xcode 15+ recomendado con Capacitor 6 |
| iPad físico                          | ✅ Para prueba real                                | Mismo Apple ID / perfil de provisioning       |
| Cable USB-C / Lightning              | Recomendado                                        | Instalación directa desde Xcode               |
| Cuenta **Apple Developer** ($99/año) | Para TestFlight / App Store / dispositivos >7 días | Sin esto: solo perfil gratuito ~7 días        |
| Xcode + Command Line Tools           | ✅                                                 | `xcode-select --install`                      |
| CocoaPods                            | ✅                                                 | `sudo gem install cocoapods` (Capacitor iOS)  |
| Node 20 + pnpm                       | ✅                                                 | Igual que el monorepo                         |

### Si solo tienes iPad (sin Mac)

1. **Android:** prueba en tablet Android (recomendado para operarios en planta).
2. **iOS:** usar **CI con runner macOS** (GitHub Actions) para generar IPA y subir a TestFlight; el iPad instala desde TestFlight.
3. **Desarrollo web:** `pnpm dev` en navegador del iPad solo valida UI web, **no** plugins nativos (cámara/BT reales).

### Para probar Bluetooth en iPad

- Confirmar que el periférico soporta **iOS** (muchas impresoras térmicas solo Android).
- BLE: iPad requiere `NSBluetoothAlwaysUsageDescription` y, en iOS 13+, permiso de ubicación en algunos escenarios de scan.
- Tener el dispositivo BLE/impresora encendido y en modo pairing durante QA.

---

## Fuera de alcance

- Publicación en App Store / Play Store (solo build y documentación).
- MDM / kiosk en iOS (task 14 cubre Android).
- Backend nuevo para fotos o impresión (usar APIs/incidentes existentes).

---

## Validation (epic)

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant && npx cap sync
# Android (cualquier OS con Android Studio)
npx cap run android
# iOS (solo Mac)
npx cap run ios
```
