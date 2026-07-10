# NOM-14 Task 05 — NovedadesService (submit y aprobaciones)

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 04](./task-04-type-config-service.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Implementar `PayrollNovedadesService` con `submit()`, flujo de aprobación supervisor/RRHH, validaciones de soporte, solapamiento y resolución de supervisor (epic D1, D2, PC-1).

---

## Scope

### Archivos

- `apps/api/src/payroll-novedades/service/payroll-novedades.service.ts`
- `apps/api/src/payroll-novedades/utils/supervisor-resolution.utils.ts`
- `apps/api/src/payroll-novedades/test/payroll-novedades.service.spec.ts`

### Métodos

#### `submit(tenantId, actorUserId, input: SubmitNovedadInput)`

1. Cargar `NovedadTypeConfig` del tipo.
2. Validar `startDate <= endDate`.
3. Si `requiresSupportDocument` y sin `supportStorageObjectId` → `BadRequestException`.
4. Si `type === AUSENCIA_INJUSTIFICADA` y `requestedBy !== RRHH` → `ForbiddenException`.
5. Resolver `isPaid` desde input o `isPaidDefault` de config.
6. `findOverlapping` — si hay conflicto y `!overlapWarningAck` → `ConflictException` con lista de IDs.
7. Resolver ruta de aprobación:
   - `requestedBy === RRHH` → ver D4 epic (`PENDIENTE_RRHH` o `APROBADA` si `autoApprove`).
   - `requestedBy === EMPLEADO`:
     - Si `requiresSupervisorApproval` → intentar resolver supervisor (D1).
     - Con supervisor resoluble → `PENDIENTE_SUPERVISOR`.
     - Sin supervisor → `PENDIENTE_RRHH` + warning `NO_SUPERVISOR_ASSIGNED`.
     - Sin supervisor requerido → `PENDIENTE_RRHH`.
8. Persistir y retornar `SubmitNovedadResult`.
9. Disparar notificación (stub/delegar task 08).

#### `approveBySupervisor(tenantId, actorUserId, novedadId)`

- Precondición: `status === PENDIENTE_SUPERVISOR`.
- Validar actor puede aprobar empleado solicitante (reutilizar lógica OS-589 D9: sede + jerarquía cargo).
- Transición → `PENDIENTE_RRHH`; set `supervisorApproverId`, `supervisorDecisionAt`.

#### `rejectBySupervisor(tenantId, actorUserId, input: RejectNovedadInput)`

- `rejectionReason` obligatorio.
- Transición → `RECHAZADA`.

#### `approveByRRHH(tenantId, actorUserId, novedadId)`

- Precondición: `status === PENDIENTE_RRHH`.
- Validar rol `NOMINA`.
- Transición → `APROBADA`; set `rrhhApproverId`, `rrhhDecisionAt`.

#### `rejectByRRHH(tenantId, actorUserId, input: RejectNovedadInput)`

- Igual que supervisor pero desde `PENDIENTE_RRHH`.

#### `list` / `findOne`

- Delegar repository; service aplica scoping supervisor (solo inbox de sus empleados).

### Helper `assertSupervisorCanActOnEmployee(tenantId, actorUserId, employeeId)`

Testeable en aislamiento — copiar/adaptar de `VacationsService` sin duplicar lógica masiva (extraer a util compartido si ya existe).

### Excepciones

| Caso                 | Excepción             |
| -------------------- | --------------------- |
| No encontrada        | `NotFoundException`   |
| Transición inválida  | `BadRequestException` |
| Sin permiso          | `ForbiddenException`  |
| Solapamiento sin ack | `ConflictException`   |
| Soporte faltante     | `BadRequestException` |

### Tests obligatorios (epic)

- `PERMISO_REMUNERADO` → `PENDIENTE_SUPERVISOR` → approve supervisor → `PENDIENTE_RRHH`.
- `LICENCIA_MATERNIDAD` → directo `PENDIENTE_RRHH`.
- Tipo con supervisor requerido pero **sin supervisor resoluble** → `PENDIENTE_RRHH` + warning (no bloquea).
- Rechazo supervisor y RRHH con motivo.
- RRHH crea con `autoApprove`.
- Solapamiento sin `overlapWarningAck` falla; con ack persiste.

---

## Out of scope

- Storage upload (task 06).
- Liquidación (task 07).
- Notificaciones reales (task 08 — stub/mock).
- Endpoints HTTP (task 09).

---

## Files allowed

- `apps/api/src/payroll-novedades/service/payroll-novedades.service.ts` — create
- `apps/api/src/payroll-novedades/utils/**` — create
- `apps/api/src/payroll-novedades/test/payroll-novedades.service.spec.ts` — create
- `apps/api/src/payroll-novedades/payroll-novedades.module.ts` — modify

**Dependencias de módulo:** `UserLocationsService`, acceso a jerarquía de cargos (mismo que vacaciones).

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Máquina de estados D2 implementada.
- [ ] PC-1: ruta según `NovedadTypeConfig`, no hardcode por tipo en service.
- [ ] D1: resolución supervisor con fallback a RRHH.
- [ ] PC-5: solapamiento con ack.
- [ ] Cobertura service ≥ 80%.
- [ ] `pnpm --filter=api test -- payroll-novedades.service.spec` pasa.

---

## Validation commands

```bash
pnpm --filter=api test -- payroll-novedades.service.spec --coverage
node scripts/validate-structure.js
```
