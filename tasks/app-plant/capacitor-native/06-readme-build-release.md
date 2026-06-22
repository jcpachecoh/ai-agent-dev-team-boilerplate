# Task 06: Documentación build y release

**Domain:** `[DOCS]` / `[MOBILE]`  
**Depends on:** tasks 01–05

---

## Goal

Documentar en `apps/plant/README.md` (o `docs/plant-native.md` si el equipo prefiere) los pasos de **build, sync, run y release** para Android e iOS.

---

## Scope

Secciones obligatorias en README:

1. **Prerrequisitos**
   - Node 20, pnpm, Android Studio, SDK 29+
   - Mac + Xcode + CocoaPods para iOS
   - Cuenta Apple Developer (TestFlight/release)

2. **Desarrollo web**

   ```bash
   pnpm turbo dev --filter=@restopsiq/plant
   ```

3. **Build + sync**

   ```bash
   pnpm turbo build --filter=@restopsiq/plant
   cd apps/plant && npx cap sync
   ```

4. **Run en dispositivo**
   - Android: `npx cap run android`
   - iOS: `npx cap run ios` (Mac)
   - Live reload opcional (`server.url` en dev — documentar riesgos)

5. **Release Android**
   - `pnpm run build:android`
   - `./gradlew assembleRelease`
   - Variables de firma (env, no commitear keystore)
   - Referencia task 14 kiosk

6. **Release iOS**
   - Abrir `ios/App/App.xcworkspace` en Xcode
   - Signing & Capabilities
   - Archive → TestFlight o Ad Hoc
   - Limitación: **no se puede archivar desde iPad**

7. **Plugins nativos**
   - Tabla: Camera, Bluetooth, Preferences, Keep Awake, Capgo
   - Enlace a tasks 02–04 para permisos

8. **Troubleshooting**
   - `dist` vacío → correr build antes de sync
   - Permisos BLE en Android 12+
   - iOS: “Developer Mode” en iPad (iOS 16+)

---

## Out of scope

- Pipeline CI/CD completo (GitHub Actions macOS puede ser task futura)
- Política de privacidad App Store

---

## Files allowed

- `apps/plant/README.md`
- `docs/plant-native.md` (opcional)

---

## Files forbidden

- `packages/**`
- Commits de keystores o certificados

---

## Acceptance criteria

- [ ] Un desarrollador nuevo sigue el README y ejecuta la app en Android sin preguntar al equipo
- [ ] Sección iOS deja claro requisito de **Mac**
- [ ] Pasos de cámara y Bluetooth referencian permisos (task 04)
- [ ] Enlace al epic `tasks/app-plant/capacitor-native/00-epic-and-decisions.md`

---

## Validation

Revisión por par (otro dev sigue el doc en máquina limpia o emulador).
