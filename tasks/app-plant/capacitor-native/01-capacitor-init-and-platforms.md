# Task 01: Capacitor init + plataformas Android/iOS

**Domain:** `[FRONTEND]` / `[MOBILE]`  
**Depends on:** `tasks/app-plant/01-scaffold-apps-plant.md` (✅), `06-pwa-offline-workbox.md` (✅)  
**Blocks:** tasks 02–06 de este epic

---

## Goal

Asegurar que el wrapper Capacitor está inicializado correctamente y que las carpetas nativas **Android** e **iOS** se generan y sincronizan desde el build de Vite (`dist`).

---

## Scope

- Verificar / completar `npx cap init` si falta algo en `capacitor.config.ts`:
  - `appId`: `com.restopsiq.plant`
  - `appName`: `RestOpsIQ Plant KDS`
  - `webDir`: `dist`
- Build web: `pnpm turbo build --filter=@restopsiq/plant`
- Agregar plataformas (una vez por máquina de desarrollo):
  ```bash
  cd apps/plant
  npx cap add android
  npx cap add ios
  npx cap sync
  ```
- Scripts en `apps/plant/package.json`:
  - `cap:sync` (ya existe)
  - `build:android` (ya existe)
  - Añadir `build:ios`: `pnpm run build && cap sync ios`
- Documentar que `android/` e `ios/` van en `.gitignore` (generados; no editar a mano salvo hooks documentados).

---

## Out of scope

- Plugins cámara / Bluetooth (tasks 02–03)
- Firma release / keystore (task 06 + task 14)
- Cambios en `packages/`

---

## Files allowed

- `apps/plant/capacitor.config.ts`
- `apps/plant/package.json`
- `apps/plant/.gitignore`
- `apps/plant/README.md` (sección mínima “primera vez nativo”)

---

## Files forbidden

- `pnpm-lock.yaml` (salvo que el equipo apruebe explícitamente en esta task)
- `packages/**`
- `apps/api/**`
- Edición manual masiva dentro de `android/**` o `ios/**` (solo vía Capacitor hooks si se documenta)

---

## Acceptance criteria

- [ ] `pnpm turbo build --filter=@restopsiq/plant` genera `apps/plant/dist`
- [ ] `npx cap sync` copia `dist` a proyectos nativos sin error
- [ ] `npx cap run android` abre la app en emulador o dispositivo Android
- [ ] `npx cap run ios` abre la app en simulador o iPad (requiere Mac)
- [ ] README indica comandos de primera instalación de plataformas

---

## Validation commands

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant && npx cap sync
npx cap run android
# En Mac:
npx cap run ios
```
