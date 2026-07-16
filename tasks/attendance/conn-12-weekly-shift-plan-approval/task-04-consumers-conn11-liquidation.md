# CONN-12 Task 04 — Consumidores: CONN-11 y liquidación solo malla aprobada

**Domain:** `[BACKEND]` `[ATTENDANCE]` `[PAYROLL]`  
**Status:** `completed`  
**Depends on:** task-02  
**Epic:** [CONN-12](./00-epic-and-decisions.md)

---

## Goal

`ShiftResolutionService` (y por tanto CONN-11 corte + liquidación que lean turno planificado) **ignoran** asignaciones de semanas/sedes cuyo plan no está `APPROVED`.

---

## Scope

1. Extender resolución de turno del día:
   - Si existe plan semanal para la sede/semana del `workDate` y `status !== APPROVED` → tratar como sin asignación operativa (`NONE` / REST según reglas acordadas), **no** como turno ASSIGNED para corte/pago.
2. CONN-11 `JornadaCutoffService` / scheduler: solo corta contra turno resuelto operativo (aprobado).
3. Cualquier path de liquidación / HObj que use `resolveForDay` hereda el filtro (sin duplicar lógica).
4. Tests: malla sin aprobar **no** alimenta liquidación/corte (caso de aceptación epic).

---

## Out of scope

- UI aprobación.
- Same-day override (task 05 puede marcar asignaciones same-day como operativas).
- Cambio de fórmulas de nómina.

---

## Files allowed

- `apps/api/src/turnos/service/shift-resolution.service.ts`
- `apps/api/src/turnos/test/shift-resolution.service.spec.ts`
- `apps/api/src/attendance/service/jornada-cutoff.service.ts` (solo si necesita assert explícito)
- `apps/api/src/attendance/test/**` relacionados al corte
- Paths de liquidación que llamen resolución de turno (mínimo necesario)
- Este archivo de tarea

## Files forbidden

- Frontend
- Schema (salvo lectura)
- CONN-06 prorrateo informe (salvo que el resolver de sede lea turno — coordinar con task-05)

---

## Acceptance criteria

- [x] Con plan no APPROVED (o sin plan), el calendario no aporta ASSIGNED/REST operativo.
- [x] Con plan APPROVED, comportamiento actual de resolución se mantiene.
- [x] Test explícito: malla sin aprobar → `NONE` / corte sin candidatos.

---

## Validation commands

```bash
pnpm --filter=api exec jest src/turnos/test/shift-resolution.service.spec.ts --silent
pnpm --filter=api exec jest src/attendance/test/jornada-cutoff.service.spec.ts --silent
pnpm --filter=api exec tsc --noEmit
```
