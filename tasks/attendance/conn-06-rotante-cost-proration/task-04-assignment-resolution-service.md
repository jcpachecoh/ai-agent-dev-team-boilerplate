# CONN-06 Task 04 — Servicio de resolución automática + hooks

**Domain:** `[BACKEND]` `[ATTENDANCE]`  
**Status:** `completed`  
**Depends on:** [Task 03](./task-03-repository.md), CONN-01, CONN-03  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Implementar `DailyCostCenterAssignmentService` que resuelve la sede diaria para empleados rotantes desde turnos (CONN-03) o marcación (CONN-01), con hooks en los flujos existentes.

---

## Scope

### `DailyCostCenterAssignmentService`

#### `resolveFromShift(input)`

- Entrada: `tenantId`, `employeeId`, `workDate`, `locationId`, `shiftId`.
- Precondición: empleado con `costCenter = ROTANTE` (consultar `EmployeeDetails`; skip silencioso si no rotante).
- Acción: `upsertForDay` con `source = TURNO_ASIGNADO`.

**Hook CONN-03:** invocar cuando se confirma/asigna turno con sede en malla (`EmployeeShiftAssignment` o equivalente existente en `turnos/`). Identificar punto exacto en codebase durante implementación (ej. servicio de asignación de turnos post-save).

#### `resolveFromAttendance(input)`

- Entrada: `tenantId`, `employeeId`, `eventDate`, `locationId` del evento de marcación.
- Precondición: rotante + `locationId` identificable en el evento.
- Acción: `upsertForDay` con `source = MARCACION_ASISTENCIA` (solo si no existe `MANUAL` ni `TURNO_ASIGNADO` según reglas task 03).

**Hook CONN-01:** invocar desde `AttendanceService.registerEvent()` (o flujo unificado ASIS-UNI) después de persistir evento con sede válida.

#### Conflictos mismo día (D7)

- Si ya existe `TURNO_ASIGNADO`, marcación **no** downgrade.
- Si turno cambia de sede el mismo día, actualizar asignación turno (fuente turno gana sobre marcación previa).

### Módulo wiring

- Importar `DailyCostCenterModule` en `TurnosModule` y `AttendanceModule` (o exportar servicio desde módulo compartido).
- Inyección lazy/evitar dependencias circulares con `forwardRef` si necesario.

### Logging

- Log debug cuando skip: empleado no rotante, sin locationId, manual existente bloquea update.

---

## Out of scope

- API manual (task 06).
- UI calendario (task 06).
- Prorrateo NOM-24 (task 07).
- Backfill histórico masivo (job separado — fuera de epic salvo script documentado opcional).

---

## Files allowed

- `apps/api/src/daily-cost-center/service/**`
- `apps/api/src/daily-cost-center/daily-cost-center.module.ts`
- `apps/api/src/daily-cost-center/test/daily-cost-center-assignment.service.spec.ts`
- `apps/api/src/attendance/service/attendance.service.ts` (solo hook mínimo)
- `apps/api/src/attendance/attendance.module.ts`
- `apps/api/src/turnos/**` (solo hook mínimo en servicio de asignación de turnos)
- `apps/api/src/attendance/test/**` (ajustes mocks si hook agrega dependencia)

---

## Files forbidden

- `schema.prisma`
- `apps/web-app/**`
- NOM-24 / reports (task 07)

---

## Acceptance criteria

- [x] Empleado rotante con turno en sede X genera `DailyCostCenterAssignment` para ese día con `TURNO_ASIGNADO`.
- [x] Empleado rotante sin turno pero con marcación en sede Y genera asignación `MARCACION_ASISTENCIA`.
- [x] Empleado no rotante: hooks no crean asignaciones.
- [x] Asignación `MANUAL` existente no se sobrescribe por marcación/turno posterior.
- [x] Tests unitarios service + hook attendance mock.

---

## Validation commands

```bash
pnpm --filter=api test -- daily-cost-center-assignment.service
pnpm --filter=api test -- attendance.service
pnpm --filter=api typecheck
node scripts/validate-structure.js
```
