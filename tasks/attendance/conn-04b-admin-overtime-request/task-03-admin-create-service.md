# CONN-04b Task 03 — Servicio de creación administrativa

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 02](./task-02-interfaces-repository.md)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Implementar la creación de solicitudes `SOLICITUD_ADMINISTRATIVA` (N empleados, tx all-or-nothing), cálculo de `proposedMinutes`, estado inicial Ops, y notificación stub al nivel pendiente.

---

## Scope

### Service

- `OvertimeAdminCreateService.createAdministrativeBatch(tenantId, actorUserId, input)` + facade en `OvertimeService`.
- Generar un `batchId` (`crypto.randomUUID`) por llamada.
- Por cada `employeeId`: crear `OvertimeRequest` con:
  - `type = SOLICITUD_ADMINISTRATIVA`
  - `status = PENDIENTE_GERENCIA_OPERACIONES`
  - campos `workDate` / `proposed*` / `reasonOptionId` / `requestedByUserId` / `batchId`
  - `payrollPeriod` derivado de `workDate` (`formatPayrollPeriod`)
  - `shiftEndTime` / `actualEndTime` / `accumulatedMinutes` = `null`
- No crear approval nivel `ADMINISTRADOR`.
- Tras create (fuera de la tx): `notifyLevelPending(..., PENDIENTE_GERENCIA_OPERACIONES)` best-effort por solicitud.

### Validaciones de negocio

- Ventana: `proposedEndTime > proposedStartTime`; minutos ≥ 1 (sin máximo inventado).
- Medianoche: instantes absolutos; `proposedStart` debe caer en `workDate` (America/Bogota).
- Motivo activo `OVERTIME_REASON` vía `EmployeeCatalogRepository.findActiveByIdAndType`.
- Empleados activos del tenant, `deletedAt` null, `locationId` = sede solicitada (bulk).
- Solicitante: cargo `OVERTIME_ADMIN_REQUESTER_POSITION_IDS` (`pos-pdl-001`) + `UserLocation` de la sede. **No** NOMINA create (P4 pendiente). **No** usa `OVERTIME_APPROVER_POSITION_IDS` para el solicitante.
- Solape app-layer con Ops/GG/APROBADA; OBJETADA no bloquea; contiguas OK.
- P2002 → `ConflictException`.
- **All-or-nothing:** `$transaction` + overlap check dentro del tx client.

### Gaps documentados

- **Auditoría:** no hay integración reutilizable de audit log para overtime create; sin nueva tabla.
- **Notify:** Logger stub CONN-04a.
- **Concurrencia residual:** dos tx concurrentes con ventanas distintas pero solapadas pueden ambas pasar el check de overlap sin advisory lock/serializable (sin precedente en el proyecto). El unique parcial solo cubre ventana **exacta**.

---

## Out of scope

- Controller/DTOs (task-04).
- Cambios a `OvertimeDetectionService`.
- Liquidación NOM-07.
- Frontend / seeds / permisos declarativos.

---

## Files allowed (actualizado)

- `apps/api/src/overtime/service/**`
- `apps/api/src/overtime/interfaces/**`
- `apps/api/src/overtime/utils/**`
- `apps/api/src/overtime/repository/**` — lookups empleados/sede + overlap `tx`/status (necesarios para service)
- `apps/api/src/overtime/overtime.module.ts` — wiring
- `apps/api/src/overtime/overtime-approval.constants.ts` — requester positions + blocking statuses
- `apps/api/src/overtime/test/**`
- `apps/api/src/payroll/interfaces/employee-catalog.interfaces.ts`
- `apps/api/src/payroll/repository/employee-catalog.repository.ts`
- `apps/api/src/payroll/service/employee-catalog.service.ts`
- `apps/api/src/payroll/payroll.module.ts` — export `EmployeeCatalogRepository`
- `apps/api/src/payroll/test/employee-catalog.repository.spec.ts`

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/api/src/overtime/controller/**`
- `apps/web-app/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [x] N empleados → N filas mismo `batchId` en una tx.
- [x] Estado inicial `PENDIENTE_GERENCIA_OPERACIONES`.
- [x] `proposedMinutes` calculado en BE.
- [x] Fallo parcial no persiste ninguna fila.
- [x] Notify stub invocado una vez por solicitud tras éxito.
- [x] Tests: happy path, medianoche, duplicados, overlap, motivo, solicitante, P2002.

---

## Validation commands

```bash
cd apps/api && pnpm exec jest src/overtime/test/overtime-admin-create.service.spec.ts src/overtime/test/overtime.service.spec.ts --runInBand
cd apps/api && pnpm exec tsc --noEmit -p tsconfig.json
```
