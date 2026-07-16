# CONN-12 Task 05 — Asignación same-day y prevalencia de marcación (CONN-06)

**Domain:** `[BACKEND]` `[ATTENDANCE]`  
**Status:** `completed`  
**Depends on:** task-02, task-04  
**Epic:** [CONN-12](./00-epic-and-decisions.md)

---

## Goal

Permitir asignar turno **hoy para hoy** (contingencias) y que el colaborador marque en una **sede distinta** a la planificada; la marcación real alimenta CONN-06 (prorrateo).

---

## Scope

### Same-day assignment

- API/grilla permiten `workDate = today` (TZ Bogotá) aunque la semana ya esté APPROVED (según D3).
- Validar que no se bloquee “pasado” de forma que impida el día corriente (revisar reglas OS-582 `from` en pasado).

### Marcación sede ≠ planificada

- `registerEvent` / marcación kiosk-móvil-manual: **no** rechazar por mismatch de sede vs turno planificado (puede haber warning operativo, no bloqueo de negocio para este epic).
- CONN-06: ajustar resolución diaria para que, en presencia de marcación con `locationId`, esa sede prevalezca sobre `TURNO_ASIGNADO` para el día (decisión reunión D4). Documentar cambio de prioridad en epic CONN-06 si aplica.

### Test de aceptación

- Rotante con turno planificado en sede A; same-day / marcación en sede B → `DailyCostCenterAssignment.locationId = B` (fuente marcación).

---

## Out of scope

- UI completa de aprobación (task 07).
- Fix genérico marcación manual (task 06) — coordinar si el bug bloquea este flujo.

---

## Files allowed

- `apps/api/src/turnos/**` (assign same-day rules)
- `apps/api/src/daily-cost-center/**` (prioridad fuentes)
- `apps/api/src/attendance/service/attendance.service.ts` (solo si hay rechazo indebido por sede)
- Tests correspondientes
- Este archivo de tarea

## Files forbidden

- Rediseño UI grilla completo
- Cambios NOM-24 salvo lo estrictamente necesario para el test

---

## Acceptance criteria

- [x] Se puede asignar turno el mismo día (incluso con plan APPROVED — task-03/05).
- [x] Colaborador puede marcar en sede distinta a la planificada (sin bloqueo por mismatch).
- [x] CONN-06: `MARCACION_ASISTENCIA` > `TURNO_ASIGNADO`; sede de marcación prevalece.
- [x] Test: rotante turno sede A + marcación sede B → assignment en B.

---

## Validation commands

```bash
pnpm --filter=api exec jest src/daily-cost-center/test --silent
pnpm --filter=api exec jest src/turnos/test --silent
pnpm --filter=api exec tsc --noEmit
```
