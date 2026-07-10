# CONN-05 Task 06 — web-app: wiring tarjeta de asistencia

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `pending`  
**Depends on:** [Task 04](./task-04-attendance-api-integration.md), [Task 05](./task-05-packages-ui-modal.md)  
**Epic:** [CONN-05](./00-epic-and-decisions.md)

---

## Goal

Conectar `AttendanceCardScreen` al catálogo unificado y al flujo de provisionamiento, **sin** crear componentes visuales locales fuera de `@restopsiq/ui`.

---

## Scope

### API client

- `fetchManualMarkingReasons()` en `attendance.client.ts`
- Hook `useManualMarkingReasonsQuery` (React Query)

### Pantalla

- `AttendanceCardScreen.tsx`:
  - Pasar `reasonOptions` al `AsistenciaTarjetaMarkingModal` desde API (o shared fallback en dev).
  - Enviar `reason` con código del catálogo unificado en `createManualMarking`.
  - Toast de éxito diferenciado si se provisionó novedad/incapacidad (“Marcación y novedad registradas”).
  - Gate de rol: solo roles con escritura nómina pueden elegir motivos ≠ `CORRECCION_MARCACION` (opcional UX — backend es source of truth).

### Tests

- Actualizar `AttendanceCardScreen.test.tsx`:
  - Catálogo incluye `CORRECCION_MARCACION` y un `NovedadType`.
  - Ya no assert sobre `FORGOT` / `SUPERVISOR_CORRECTION` como opciones principales.

---

## Out of scope

- Rediseño de tarjeta OS-551.
- Bandejas NOM-14 / NOM-13.
- Nuevos componentes SCSS de tabla/página (usar packages).

---

## Files allowed

- `apps/web-app/src/features/attendance/api/attendance.client.ts` — modify
- `apps/web-app/src/features/attendance/hooks/**` — modify/create
- `apps/web-app/src/features/attendance/screens/AttendanceCardScreen.tsx` — modify
- `apps/web-app/src/features/attendance/screens/AttendanceCardScreen.test.tsx` — modify

---

## Files forbidden

- `packages/ui/**` (task 05)
- `apps/api/**`
- `prisma/**`

---

## Acceptance criteria

- [ ] Modal recibe opciones del catálogo unificado.
- [ ] No hay labels/códigos de motivo hardcodeados en `web-app`.
- [ ] Tests de tarjeta actualizados y en verde.

---

## Validation commands

```bash
pnpm --filter=web-app test -- AttendanceCardScreen
pnpm --filter=web-app typecheck
```
