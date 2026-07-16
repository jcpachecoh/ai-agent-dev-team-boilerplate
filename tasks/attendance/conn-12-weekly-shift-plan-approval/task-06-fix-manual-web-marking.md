# CONN-12 Task 06 — Corregir defecto: marcación manual desde la web

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]`  
**Status:** `completed`  
**Depends on:** — (puede paralelizarse; priorizar si bloquea demo)  
**Epic:** [CONN-12](./00-epic-and-decisions.md)  
**Jira relacionados:** OS-553, OS-554

---

## Goal

La marcación manual desde la tarjeta web (flujo demo) funciona de extremo a extremo: el usuario crea ENTRY/EXIT manual con motivo y ve el resultado en la tarjeta sin error.

---

## Scope

1. **Reproducir** el defecto detectado en demo (documentar pasos + request/response o error UI).
2. **Corregir** root cause (BE y/o FE): validación de sede, `locationId` null en rotante, DTO motivo, permisos, timezone `workDate`, etc.
3. Cubrir con test de regresión (service y/o componente según capa del bug).
4. No ampliar alcance a historial audit UI ni motivos configurables (fuera de OS-553 mínimo).

---

## Out of scope

- Ciclo de aprobación semanal.
- App móvil.
- Nuevas features del modal más allá de restaurar el happy path.

---

## Files allowed

- `apps/api/src/attendance/**` (card/manual markings)
- `apps/web-app/src/features/attendance/**` (tarjeta / modal marcación)
- `packages/ui/**` solo si el bug está en componente compartido de asistencia
- Tests relacionados
- Este archivo de tarea

## Files forbidden

- Schema/migrations no relacionados al bug
- Turnos approval (tasks 01–04)
- `package.json` / lockfile salvo dependencia ya existente mal tipada

---

## Root cause (demo)

1. **Primario:** `AttendanceCardService` rechazaba empleados con `locationId === null` (ROTANTE) → 400 “tarjeta no aplica…”. El FE también bloqueaba navegación sin sede fija.
2. **Secundario:** draft EXIT en FE default **17:00** vs turnos seed que terminan **16:00** (+ ventana ±30 min) → “fuera de la ventana del turno”.

## Fix

- BE: `resolveCardLocationId(employee.locationId, preferred)`; `locationId` opcional en query card / create marking / observation; delete scope por `log.locationId`; MANUAL no aplica assert de ventana de turno.
- FE: pasa `locationId` de la ruta en card/marking/observation; colaboradores rotante usan sede del filtro; EXIT draft → `16:00`.

---

## Acceptance criteria

- [x] Marcación manual web funciona (ENTRY y EXIT) en escenario demo.
- [x] Test de regresión del defecto.
- [x] Rotante sin `locationId` fijo no rompe el flujo si aplica al bug.

---

## Validation commands

```bash
pnpm --filter=api exec jest src/attendance/test/attendance-card.service.spec.ts --silent
pnpm --filter=api exec tsc --noEmit
# Si se toca FE:
pnpm --filter=web-app exec tsc --noEmit
```

## Validation results (2026-07-16)

- `jest` attendance-card + attendance.service: **PASS**
- `api tsc --noEmit`: **PASS**
- `web-app tsc --noEmit`: falla por errores **preexistentes** fuera de esta tarea (payroll/roles tests) + `AsignacionTurnosScreen.tsx` (CONN-12 tasks 03/07, no scope de task-06)
