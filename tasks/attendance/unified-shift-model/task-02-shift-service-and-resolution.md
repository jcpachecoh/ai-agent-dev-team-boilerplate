# SHIFT-UNI Task 02 — ShiftService: CRUD asignación + resolución unificada

**Domain:** `[BACKEND]` `[ATTENDANCE]`  
**Status:** `pending`  
**Depends on:** [task-01-schema-employee-shift-assignment.md](./task-01-schema-employee-shift-assignment.md)

---

## Goal

Implementar en el módulo `turnos/` el servicio de dominio que gestiona asignaciones vigentes por empleado y expone **un único punto de resolución** de turno para un día (`resolveForDay`, `getTargetMinutesForDay`).

---

## Scope

- Extender `TurnosService` / repositorio para `locationId` y `daysOfWeek` en CRUD de turnos.
- Nuevo submódulo o archivos en `apps/api/src/turnos/`:
  - `interfaces/employee-shift-assignment.interfaces.ts`
  - `repository/employee-shift-assignments.repository.ts`
  - `service/employee-shift-assignments.service.ts`
  - `service/shift-resolution.service.ts` — **resolver central**
  - `controller/employee-shift-assignments.controller.ts` + DTOs
- Endpoints REST (prefijo `/api`):
  - `GET /api/turnos/empleados/:employeeId/asignaciones` — historial y vigente
  - `POST /api/turnos/empleados/:employeeId/asignaciones` — nueva vigencia (cierra anterior con `effectiveTo`)
  - `PATCH /api/turnos/empleados/:employeeId/asignaciones/:id` — ajustar `effectiveTo` / cambio programado
  - `GET /api/turnos/resolver?employeeId=&locationId=&workDate=` — turno resuelto (para móvil y tests)
- RBAC: reutilizar `attendance.turnos.read` / `attendance.turnos.write`; scoping por `UserLocation` para SUPERVISOR.
- `AuditLog` en transacción al crear/cerrar asignación.
- Tests unitarios: repository, resolution service, controller.

---

## Out of scope

- Cambios en tarjeta de asistencia o payroll (Task 03/04).
- UI frontend (Task 03).
- Modificar `TurnoAssignment` calendar API (OS-582) salvo inyectar `ShiftResolutionService` si hace falta para tests.

---

## Files allowed

- `apps/api/src/turnos/**` (create/modify)
- `apps/api/src/app.module.ts` — solo si hace falta registrar providers nuevos (preferir wiring en `turnos.module.ts`)
- `apps/api/test/**` — e2e opcional

---

## Files forbidden

- `apps/api/prisma/schema.prisma` (salvo hotfix crítico acordado)
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation

### `ShiftResolutionService.resolveForDay`

```typescript
type ResolvedShift =
  | { kind: 'ASSIGNED'; source: 'CALENDAR' | 'EMPLOYEE_ASSIGNMENT'; turno: TurnoSummary; targetMinutes: number }
  | { kind: 'REST'; targetMinutes: 0 }
  | { kind: 'NONE'; targetMinutes: 0 };

resolveForDay(params: {
  tenantId: string;
  employeeId: string;
  locationId: string;
  workDate: Date; // fecha Bogotá normalizada
}): Promise<ResolvedShift>;
```

**Prioridad (épica):**

1. `TurnoAssignment` del día → ASSIGNED o REST.
2. `EmployeeShiftAssignment` vigente + `daysOfWeek` + `turno.locationId === locationId`.
3. NONE.

### `getTargetMinutesForDay`

- Delega en `resolveForDay`.
- Calcula minutos entre `horaInicio` y `horaFin` (nocturno: +1440 si `horaFin < horaInicio`).
- REST / NONE → `0`.

### Asignación empleado — reglas de negocio

- Al crear asignación con `effectiveFrom = D`, cerrar asignación abierta anterior (`effectiveTo = D - 1 día`) en la misma transacción.
- Rechazar solapamientos con `ConflictException`.
- `turno` debe pertenecer al `tenantId` y estar activo (`estado = true`, `deletedAt` null si aplica).

---

## Acceptance criteria

- [ ] `resolveForDay` con calendario ASSIGNED devuelve `source: 'CALENDAR'`.
- [ ] Sin calendario, con vigencia empleado y día en `daysOfWeek`, devuelve `source: 'EMPLOYEE_ASSIGNMENT'`.
- [ ] Día REST en calendario → `kind: 'REST'`, `targetMinutes: 0`.
- [ ] POST asignación cierra vigencia anterior y escribe `AuditLog`.
- [ ] Tests de scoping: SUPERVISOR no asigna en sede fuera de `UserLocation`.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern="turnos|shift-resolution|employee-shift"
```
