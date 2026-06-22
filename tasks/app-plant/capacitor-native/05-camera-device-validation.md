# Task 05a — Validación cámara (incidentes)

**Domain:** `[MOBILE]` `[QA]`  
**Depends on:** [02-camera-plugin.md](./02-camera-plugin.md), [04-native-permissions.md](./04-native-permissions.md)  
**Parent:** [05-device-validation.md](./05-device-validation.md)

---

## Goal

Cerrar la validación del flujo **Reportar novedad → Tomar foto** en app nativa (Android/iOS) y regresión web, sin bloquear el resto del checklist BLE.

---

## Scope

### Automatizado (Vitest)

- [x] `camera.service.test.ts` — permisos, captura nativa, cancelación, `dataUrl` vacío
- [x] `IncidentReportModal.test.tsx` — preview, error permiso, cancelación silenciosa, cola offline con foto

### Manual — Android (tablet operario)

| #   | Caso                                  | Esperado                                           | Estado |
| --- | ------------------------------------- | -------------------------------------------------- | ------ |
| A1  | Reportar novedad → **Tomar foto**     | Diálogo cámara/galería nativo; preview en modal    | [ ]    |
| A2  | Enviar incidente **con foto** online  | POST incidente OK; celda en estado novedad         | [ ]    |
| A3  | Enviar incidente **con foto** offline | Cola offline; mensaje sync pendiente               | [ ]    |
| A4  | **Denegar** permiso de cámara         | Mensaje claro; app estable; reintento tras Ajustes | [ ]    |

### Manual — iOS / iPad

| #   | Caso                | Esperado                            | Estado |
| --- | ------------------- | ----------------------------------- | ------ |
| I1  | Cámara en incidente | Diálogo permiso + captura + preview | [ ]    |
| I2  | Denegar permiso     | Mensaje claro sin crash             | [ ]    |

### Manual — Web (regresión)

| #   | Caso                                       | Esperado                                                | Estado           |
| --- | ------------------------------------------ | ------------------------------------------------------- | ---------------- |
| W1  | `pnpm dev` → Reportar novedad → Tomar foto | Fallback file input; preview si el usuario elige imagen | [x] automatizado |
| W2  | Cancelar captura                           | Sin mensaje de error                                    | [x] automatizado |

---

## Prerrequisitos (manual nativo)

```bash
pnpm turbo build --filter=@restopsiq/plant
cd apps/plant && npx cap sync
npx cap run android   # o ios en Mac
```

Permisos: [`apps/plant/docs/native-permissions.md`](../../../apps/plant/docs/native-permissions.md)

---

## Validation commands

```bash
pnpm --filter @restopsiq/plant test -- camera IncidentReportModal
pnpm --filter @restopsiq/plant typecheck
```

Manual nativo: casos A1–A4 e I1–I2 en dispositivo físico o emulador con cámara.

---

## Acceptance criteria

- [x] Tests automatizados de cámara en verde
- [ ] Android: captura nativa + preview (A1)
- [ ] Android: permiso denegado manejado (A4)
- [ ] iOS: captura + permiso (I1–I2) — si aplica alcance iPad
- [x] Web: fallback y cancelación cubiertos por tests

---

## Notas

- La foto se comprime vía `compressImageBase64` antes de cola/API (`incident.service.ts`).
- Subida HTTP de fotos a CDN: **fuera de alcance**; offline usa `imageBase64` en cola.
