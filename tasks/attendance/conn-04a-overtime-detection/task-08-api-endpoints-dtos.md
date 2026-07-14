# CONN-04a Task 08 — API REST, DTOs y permisos

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 05](./task-05-approval-cascade-service.md), [Task 06](./task-06-notifications.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Exponer endpoints REST para bandeja de aprobación, aprobar, objetar y consultar solicitudes. Aprobación validada por **cargo** (D4); permiso RBAC solo para lectura.

---

## Scope

### Módulo

- `apps/api/src/overtime/overtime.module.ts`
- `apps/api/src/overtime/controller/overtime.controller.ts`
- `apps/api/src/overtime/controller/dto/**`

### Endpoints sugeridos

| Método | Ruta                                        | Descripción                                             |
| ------ | ------------------------------------------- | ------------------------------------------------------- |
| `GET`  | `/attendance/overtime-requests`             | Bandeja filtrada por cargo del actor / estado / período |
| `GET`  | `/attendance/overtime-requests/:id`         | Detalle + historial de aprobaciones                     |
| `POST` | `/attendance/overtime-requests/:id/approve` | Aprobar nivel activo                                    |
| `POST` | `/attendance/overtime-requests/:id/object`  | Objetar con comentario                                  |
| `GET`  | `/attendance/overtime-requests/summary`     | Conteo pendientes por período (OS-380)                  |

### Permisos (seed)

| Código                     | Roles                               |
| -------------------------- | ----------------------------------- |
| `attendance.overtime.read` | OWNER, SUPER_ADMIN, NOMINA, MANAGER |

> Aprobar/objetar no usa permiso RBAC por nivel — se valida por `EmployeeDetails.positionId` (D4).

- Agregar a `prisma/seed.ts` en `PERMISSION_SEEDS` y `ROLE_PERMISSION_MATRIX`.
- `@UseGuards(RolesGuard)` para lectura; servicio valida cargo en approve/object.

### DTOs

- `ListOvertimeRequestsQueryDto` — `status`, `payrollPeriod`, `locationId`, `cursor`, `take`
- `ApproveOvertimeRequestDto` — `comment?`
- `ObjectOvertimeRequestDto` — `comment` required
- Response types con empleado, sede, minutos, turno, fechas.

### Wiring

- Registrar `OvertimeModule` en `app.module.ts` **solo en esta task** (excepción explícita a regla SDD).
- Exportar `OvertimeDetectionService` para `AttendanceModule`.

---

## Out of scope

- GraphQL.
- Frontend (task 09).
- Postman completo (task 10).

---

## Files allowed

- `apps/api/src/overtime/**` — create/modify
- `apps/api/src/app.module.ts` — modify (import OvertimeModule)
- `apps/api/src/attendance/attendance.module.ts` — modify (import OvertimeModule)
- `prisma/seed.ts` — modify (solo permisos overtime)
- `apps/api/src/overtime/test/overtime.controller.spec.ts` — create

---

## Files forbidden

- `prisma/schema.prisma`
- `package.json` / `pnpm-lock.yaml`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Controller delega en services; sin lógica de negocio.
- [ ] `tenantId` desde JWT (`@CurrentUser()`), nunca del body.
- [ ] Tests controller mockean services.
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
pnpm --filter=api test -- overtime.controller
node scripts/validate-structure.js
pnpm typecheck
```
