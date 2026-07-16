# CONN-12 Task 03 — Integración grilla (OS-582) + Excel (OS-583) con ciclo de aprobación

**Domain:** `[BACKEND]` `[FRONTEND]`  
**Status:** `completed`  
**Depends on:** task-01, task-02  
**Epic:** [CONN-12](./00-epic-and-decisions.md)

---

## Goal

La planeación manual en grilla y la carga masiva Excel usan los **mismos campos** y escriben asignaciones que quedan bajo el plan semanal en estado no operativo hasta aprobación (salvo reglas same-day de task-05).

---

## Scope

### Backend

- Import OS-583 y `assign` de OS-582:
  - Si el plan de la semana/sede no está APPROVED (o no existe → se crea DRAFT), las escrituras actualizan celdas del draft.
  - Si el plan está APPROVED: bloquear edición de días futuros de esa semana **excepto** same-day (delegar a task-05) o exigir reopen.
- Plantilla Excel: **sin cambiar campos**; mismos headers/columnas que hoy (Documento, Nombre, Employee ID, fechas…).
- Tras import masivo exitoso, el plan permanece DRAFT o PENDING según política (no auto-aprobar).

### Frontend (mínimo en esta task)

- Deshabilitar edición de celdas cuando plan APPROVED (indicador básico); UX completa de botones en task-07.
- Modal masivo sigue funcionando con la misma plantilla.

---

## Out of scope

- Flujo visual completo submit/approve (task 07).
- Filtro consumidores CONN-11 (task 04).
- Fix marcación manual (task 06).

---

## Files allowed

- `apps/api/src/turnos/service/turno-assignments*.ts`
- `apps/api/src/turnos/service/turno-assignments-import.service.ts`
- `apps/api/src/turnos/service/turno-assignments-template.service.ts`
- `apps/api/src/turnos/test/**` relacionados
- `apps/web-app/src/features/attendance/**` solo lo necesario para bloquear edición si plan APPROVED
- Este archivo de tarea

## Files forbidden

- Cambios de campos de plantilla Excel no alineados a creación manual
- `schema.prisma` (salvo FK menor ya prevista en task-01)
- CONN-06 / reports

---

## Acceptance criteria

- [x] Carga masiva Excel funcional con plantilla actual (mismos campos que manual) — import sigue por `assign()`/`remove()` con el mismo gate.
- [x] Escrituras aseguran plan DRAFT (getOrCreate); no auto-aprueban.
- [x] Plan APPROVED no se edita libremente desde grilla/import (salvo same-day).

---

## Validation commands

```bash
pnpm --filter=api exec jest src/turnos/test --silent
pnpm --filter=api exec tsc --noEmit
```
