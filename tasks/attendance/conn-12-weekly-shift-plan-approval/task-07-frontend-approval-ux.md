# CONN-12 Task 07 — UX de aprobación semanal en grilla de turnos

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `completed`  
**Depends on:** task-02, task-03  
**Epic:** [CONN-12](./00-epic-and-decisions.md)

---

## Goal

El administrador de sede puede enviar la planeación a aprobación; el gerente de operaciones puede aprobar o rechazar; el estado del plan es visible en la grilla semanal.

---

## Scope

- Indicador de estado del plan (DRAFT / PENDING / APPROVED / REJECTED) en `/asistencia/turnos/asignacion` (o ruta vigente OS-582).
- Acciones por rol:
  - Admin sede: **Enviar a aprobación**
  - Gerente ops: **Aprobar** / **Rechazar** (motivo)
- Estados de UI: loading / error / empty según patrones del feature.
- Estilos: CSS Modules existentes del feature attendance/turnos.
- Client API + React Query keys para el plan semanal.

---

## Out of scope

- Rediseño completo de la grilla.
- Notificaciones email (opcional futuro).
- Cambios Excel más allá de lo ya en task-03.

---

## Files allowed

- `apps/web-app/src/features/attendance/**` (screens/components/hooks/api de turnos)
- Este archivo de tarea

## Files forbidden

- Backend salvo contrato DTO ya expuesto
- `packages/` salvo componente UI ya usado por el feature

---

## Acceptance criteria

- [x] Flujo submit → approve visible y usable por roles correctos.
- [x] Plan APPROVED se refleja en UI; edición bloqueada según task-03.
- [x] Reject con motivo muestra estado REJECTED.

---

## Validation commands

```bash
pnpm --filter=web-app exec tsc --noEmit
```

## Validation results (2026-07-16)

- `vitest AsignacionTurnosScreen.test.tsx`: **PASS** (13 tests, incl. submit/approve/reject)
- `web-app tsc --noEmit`: errores **preexistentes** fuera de attendance (payroll/roles); sin errores nuevos en archivos de esta tarea
