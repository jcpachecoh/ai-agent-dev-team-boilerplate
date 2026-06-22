# Task 02: Plugin cámara + flujo de incidentes

**Domain:** `[FRONTEND]` / `[MOBILE]`  
**Depends on:** `01-capacitor-init-and-platforms.md`, flujo incidente en planta (MES-08 / pantalla incidente)  
**Spec:** `specs/restopsiq-plant-context.md` § Native Camera

---

## Goal

Integrar `@capacitor/camera` en el flujo de **reporte de incidentes** para capturar fotos con la cámara nativa, con fallback web y cola offline.

---

## Scope

- Servicio `apps/plant/src/services/camera.service.ts` (o equivalente):
  - `takeIncidentPhoto()` usando `Camera.getPhoto()` (`quality`, `resultType: Uri` o `Base64` según cola offline)
  - Detección plataforma vía `src/utils/platform.ts`
  - En web: fallback `<input type="file" accept="image/*" capture="environment">` o mensaje claro
- Compresión antes de encolar (spec: image compression) — max width/quality documentados
- Integrar en pantalla/modal de incidente (donde el operario adjunta evidencia)
- Manejo de errores: permiso denegado, usuario canceló, sin cámara

---

## Out of scope

- Permisos plist/manifest (task 04) — esta task puede stubear; task 04 cierra permisos
- Subida HTTP al backend (usar cola offline existente si aplica)
- Bluetooth

---

## Files allowed

- `apps/plant/src/services/camera.service.ts`
- `apps/plant/src/services/camera.service.test.ts`
- `apps/plant/src/utils/platform.ts`
- Pantallas/hooks de incidente en `apps/plant/src/**` (solo archivos del flujo foto)
- `apps/plant/package.json` (solo si falta versión alineada de `@capacitor/camera`)

---

## Files forbidden

- `packages/**`
- `apps/api/**`
- `pnpm-lock.yaml` sin aprobación

---

## Acceptance criteria

- [ ] En Android nativo: al reportar incidente se abre cámara/galería y retorna imagen usable
- [ ] En iOS nativo: mismo comportamiento con permiso de cámara
- [ ] En web dev: fallback funcional o mensaje explícito
- [ ] Imagen pasa por compresión antes de guardarse en cola/local
- [ ] Tests unitarios del servicio (mock `@capacitor/camera`)

---

## Validation commands

```bash
pnpm --filter @restopsiq/plant test
pnpm --filter @restopsiq/plant typecheck
# Manual en dispositivo:
cd apps/plant && pnpm build && npx cap sync && npx cap run android
```
