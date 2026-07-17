# CONN-04b Task 06 — Frontend: solicitud admin en bandeja existente

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `done`  
**Depends on:** [Task 04](./task-04-api-permissions.md)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Permitir crear solicitudes administrativas desde la bandeja `/asistencia/tiempo-extra`, reutilizando componentes y patrones existentes (sin pantalla paralela).

---

## Scope

### UI

- Extender `OvertimeInboxScreen`: CTA “Nueva solicitud” (visible con permiso create / cargo Admin).
- Modal/drawer con:
  - Multi-select empleados (patrón OS-583 `selectedEmployeeIds` / bulk modal)
  - Sede
  - `workDate`
  - `proposedStartTime` / `proposedEndTime` (DateTime; soportar cruce de medianoche)
  - Motivo (`reasonOptionId` desde catálogo `OVERTIME_REASON`)
- Columna **Origen** / badge `type` en `OvertimeTable`.
- Estados loading / error / empty; toast éxito con conteo N.

### Client / hooks / types

- `createAdministrativeOvertimeRequests` en `overtime.client.ts`
- Mutation hook en `useOvertimeRequests.ts`
- Extender `OvertimeRequestItem` con `type`, campos propuestos, `batchId`
- Fetch motivos: reutilizar cliente de `employee-catalogs` si existe en web-app; si no, endpoint mínimo documentado.

### Permisos FE

- Ocultar CTA sin `attendance.overtime.request` (o fallar 403 con mensaje claro).
- Approve/object sin cambio (CONN-04a).

---

## Out of scope

- Ruta nueva aparte de `/asistencia/tiempo-extra`.
- Tarjeta OS-551 (task-07).
- Packages UI nuevos salvo reutilizar existentes.
- GraphQL.

---

## Files allowed

- `apps/web-app/src/features/attendance/**`
- Tests FE asociados bajo el mismo feature

---

## Files forbidden

- `apps/api/**`
- `prisma/**`
- `package.json` / `pnpm-lock.yaml`
- Pantallas nuevas fuera de attendance overtime inbox

---

## Acceptance criteria

- [x] Admin puede crear para ≥2 empleados en un submit.
- [x] Tabla muestra origen `SOLICITUD_ADMINISTRATIVA` vs detección.
- [x] Sin permiso create no se muestra CTA (o acción deshabilitada).
- [x] Errores de validación/duplicado visibles.
- [x] Tests unitarios del form/mapper o screen smoke.

---

## Validation commands

```bash
cd apps/web-app && pnpm exec vitest run src/features/attendance --passWithNoTests
# o el comando de test del monorepo usado por attendance
```
