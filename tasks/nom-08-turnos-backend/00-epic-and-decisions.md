# NOM-08 — Backend módulo Turnos (asistencia)

**Domain:** `[BACKEND]` `[ATTENDANCE]` `[RBAC]` `[AUDIT]`  
**Status:** `pending`  
**Rutas REST:** `/api/turnos`  
**Módulo NestJS propuesto:** `apps/api/src/turnos/`  
**Depends on:** NOM-03 (AttendanceLog), NOM-05 (RBAC roles `SUPER_ADMIN` / `SUPERVISOR`), USR-05 (AuditLog)

---

## Objetivo

Desarrollar el backend que soporte el catálogo de **Turnos** del sistema de asistencia: listar, crear, editar, activar/desactivar y exportar a Excel, con validaciones, RBAC y registro en `AuditLog` dentro de la misma transacción.

---

## Estado actual (codebase)

| Área                           | Hoy                                                                          | Gap                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Modelo `Turno`                 | No existe en `schema.prisma`                                                 | Crear modelo + migración                                                         |
| `AttendanceShift` enum         | Existe (MORNING/AFTERNOON/NIGHT) — dominio kiosk                             | **Distinto** del catálogo de turnos (PERMANENTE/VARIABLE, DIURNO/NOCTURNO/MIXTO) |
| Asignación turno ↔ colaborador | No existe tabla de asignaciones futuras                                      | Necesaria para validación PATCH `/estado` (AC 4)                                 |
| Excel export                   | `exceljs` ya en `apps/api/package.json`; patrón en `report-excel.service.ts` | Reutilizar estilo de encabezados                                                 |
| AuditLog                       | `AuditService.log()` + tabla `audit_logs`                                    | Mapear `cambios` del spec a `oldValue`/`newValue` JSON                           |
| RBAC                           | Roles `SUPER_ADMIN`, `SUPERVISOR` en seed                                    | Nuevos permisos `attendance.turnos.*`                                            |

---

## Decisiones de diseño

### 1. Multi-tenancy obligatorio

El SQL del requerimiento no incluye `tenantId`. En RestOpsIQ **todo** recurso de negocio es tenant-scoped:

- Agregar `tenantId` en `Turno` y `TurnoAssignment`.
- `sigla` única por tenant: `@@unique([tenantId, sigla])`.
- Todos los queries filtran por `tenantId` del JWT (`@CurrentUser()`).

### 2. Identificadores

- Usar `cuid()` (convención Prisma del repo), no `UUID`/`gen_random_uuid()`.
- `created_by` / `updated_by` → `createdByUserId` / `updatedByUserId` (FK `User`, `onDelete: SetNull`).

### 3. Paginación offset vs cursor

El requerimiento pide `page`, `limit`, `totalPages`. **Excepción documentada** al estándar cursor-based del repo: este catálogo es pequeño (≤ 200 filas, AC 1) y el contrato REST ya está definido con offset. Implementar offset solo en este módulo.

### 4. AuditLog — mapeo del spec

| Spec usuario                        | Implementación RestOpsIQ                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `usuario_id`                        | `actorUserId`                                                                                          |
| `entidad`                           | `entityType: 'Turno'`                                                                                  |
| `entidad_id`                        | `entityId`                                                                                             |
| `cambios` JSON campo/anterior/nuevo | `oldValue` / `newValue` como objetos parciales; en UPDATE solo claves modificadas                      |
| `fecha`                             | `createdAt` (automático)                                                                               |
| Misma transacción                   | `prisma.$transaction`: persistir turno + `auditLog.create` en el mismo `tx`; si audit falla → rollback |

Usar `AuditAction`: `CREATE` (POST), `UPDATE` (PUT, PATCH estado), `EXPORT` (GET exportar).

> **Nota:** `AuditRepository.create` hoy traga P2003 sin relanzar. Para AC 8, en operaciones de turnos invocar `tx.auditLog.create` directamente dentro de la transacción (o extender repository con método `createInTransaction(tx, data)` que **sí** relance errores).

### 5. RBAC — mapeo de roles

| Rol en spec    | Código en seed | Operaciones                                              |
| -------------- | -------------- | -------------------------------------------------------- |
| Superusuario   | `SUPER_ADMIN`  | GET listado, GET exportar, POST, PUT, PATCH estado       |
| Supervisor     | `SUPERVISOR`   | GET listado, GET exportar                                |
| Token inválido | —              | `401` vía `JwtAuthGuard`                                 |
| Sin permiso    | —              | `403` vía `RolesGuard` + `@Roles()` o `PermissionsGuard` |

Permisos nuevos en seed (Task 01):

| Código                    | Descripción                  |
| ------------------------- | ---------------------------- |
| `attendance.turnos.read`  | Listado + exportar           |
| `attendance.turnos.write` | Crear, editar, toggle estado |

Asignación:

- `SUPER_ADMIN`: todos (ya tiene `ALL_PERMISSION_CODES`).
- `SUPERVISOR`: solo `attendance.turnos.read`.

### 6. Asignaciones futuras (PATCH desactivar)

Para AC 4 se requiere saber si el turno tiene colaboradores asignados en fechas futuras.

Modelo mínimo en Task 01:

```prisma
model TurnoAssignment {
  id         String   @id @default(cuid())
  tenantId   String
  turnoId    String
  employeeId String   // FK EmployeeDetails
  workDate   DateTime @db.Date
  // ...
  @@index([tenantId, turnoId, workDate])
}
```

Regla PATCH desactivar (`estado: false`):

```sql
COUNT(*) FROM turno_assignments
WHERE turno_id = :id AND tenant_id = :tenantId AND work_date >= CURRENT_DATE
```

Si `count > 0` → `409 ConflictException` con body:

```json
{
  "message": "No se puede desactivar el turno: hay colaboradores asignados en fechas futuras",
  "affectedCount": 12
}
```

> CRUD de asignaciones queda **fuera de scope** (tarea futura). Task 01 solo crea la tabla; Task 02 implementa el conteo. Tests de AC 4 usan datos seed o insert directo en repositorio.

### 7. Enums

```prisma
enum TurnoTipo {
  PERMANENTE
  VARIABLE
}

enum TurnoJornada {
  DIURNO
  NOCTURNO
  MIXTO
}
```

Validar en DTO con `@IsEnum(TurnoTipo)` / `@IsEnum(TurnoJornada)`.

### 8. Horas

- Almacenar como `String` en formato `HH:mm` (Prisma no tiene tipo TIME nativo portable) **o** `@db.Time` si el equipo prefiere — documentar en Task 01.
- Validar regex `^([01]\d|2[0-3]):[0-5]\d$` en DTO.
- `horaInicio === horaFin` → `400 BadRequestException`.

### 9. Export Excel

- Ruta: `GET /api/turnos/exportar?formato=excel` (+ mismos query params de filtros del listado).
- Librería: `exceljs` (ya instalada).
- Sin registros → `204 No Content` (sin body).
- Con registros → `200`, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="turnos.xlsx"`.
- Encabezado bold + fondo diferenciado (reutilizar patrón `SOLID(DARK_BLUE)` de `report-excel.service.ts`).

### 10. Ubicación del módulo

Nuevo módulo `TurnosModule` en `apps/api/src/turnos/` (no mezclar con `attendance/` kiosk). Registrar en `app.module.ts` en Task 02.

---

## Desglose de tareas SDD

| Task | Archivo                                                            | Descripción                                                             |
| ---- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 01   | [task-01-schema-migration.md](./task-01-schema-migration.md)       | Prisma: `Turno`, `TurnoAssignment`, enums, permisos seed, migración SQL |
| 02   | [task-02-backend-turnos-rest.md](./task-02-backend-turnos-rest.md) | Módulo NestJS REST completo + tests + wire en `app.module.ts`           |

**Orden:** 01 → 02. No implementar Task 02 hasta validar Task 01.

---

## Acceptance criteria (épica)

- [ ] AC 1 — GET `/api/turnos`: lista paginada, filtros AND + search OR, < 500 ms con 200 registros.
- [ ] AC 2 — POST: validaciones 400/409, 201 + AuditLog.
- [ ] AC 3 — PUT: 404/409, AuditLog solo campos cambiados, 200.
- [ ] AC 4 — PATCH `/estado`: 404, 409 con conteo si asignaciones futuras, AuditLog estado.
- [ ] AC 5 — GET `/exportar`: .xlsx correcto, filtros, 204 sin datos.
- [ ] AC 6 — RBAC: 403 Supervisor en escritura, 401 token inválido.
- [ ] AC 7 — Enums, sigla ≤ 30, horas HH:mm.
- [ ] AC 8 — AuditLog en misma transacción; fallo audit revierte cambio.

---

## Out of scope (épica)

- Frontend del módulo Turnos.
- CRUD de asignaciones turno ↔ colaborador (solo tabla + conteo para desactivar).
- GraphQL.
- Integración con `AttendanceShift` del kiosk (tarea de convergencia futura).
- Cambios en `packages/`.
