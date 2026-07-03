# OS-582 — Asignación de Turnos (vista semanal)

**Domain:** `[BACKEND]` `[FRONTEND]` `[RBAC]` `[AUDIT]`
**Status:** `implemented`
**Rutas REST:** `/api/turnos/asignaciones`
**Ruta frontend:** `/asistencia/turnos/asignacion`
**Depends on:** NOM-08 (catálogo `Turno` + tabla `turno_assignments`), NOM-03 (`EmployeeDetails`), USR-05 (`AuditLog`), `UserLocation` (sede scoping)
**Sigue a:** OS-581 (Creación Turnos). **Precede a:** OS-583 (Asignación masiva de turnos).

---

## Alcance

Implementa la vista semanal colaborador × día para asignar turnos individualmente, reasignar, marcar descanso explícito y ver el "turno base" calculado cuando no hay asignación registrada.

### Fuera de alcance (queda para OS-583)

- Botón y lógica de "Asignación masiva" (el checkbox de selección múltiple **sí** se implementó como shell visual — actualiza el contador "Seleccionados (N)" — pero no dispara ninguna acción sobre la selección).
- Descarga/carga de plantilla Excel de cargue masivo (el botón "Descargar formato" está deshabilitado con tooltip "Disponible en Asignación masiva de turnos (OS-583)").
- Vistas "dos semanas", "día" y "mensual" (selector visible pero deshabilitado, solo "Semanal" está activo).

---

## Modelo de datos

Se extendió `TurnoAssignment` (creado vacío en NOM-08) — migración `20260703130000_os_582_turno_assignment_type`:

```prisma
enum TurnoAssignmentType {
  ASSIGNED
  REST
}

model TurnoAssignment {
  id              String              @id @default(cuid())
  tenantId        String
  turnoId         String?
  employeeId      String
  workDate        DateTime            @db.Date
  type            TurnoAssignmentType @default(ASSIGNED)
  createdByUserId String?
  updatedByUserId String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  turno     Turno?          @relation(fields: [turnoId], references: [id])
  employee  EmployeeDetails @relation(fields: [employeeId], references: [id])
  createdBy User?           @relation("TurnoAssignmentCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  updatedBy User?           @relation("TurnoAssignmentUpdatedBy", fields: [updatedByUserId], references: [id], onDelete: SetNull)

  @@unique([tenantId, employeeId, workDate])
  @@index([tenantId, turnoId, workDate])
  @@index([tenantId, employeeId, workDate])
  @@map("turno_assignments")
}
```

### Reglas BASE / REST / ASSIGNED

| Estado     | ¿Se guarda en DB?    | `turnoId`       | Regla                                                                                                                                                                                                            |
| ---------- | -------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ASSIGNED` | Sí (`type=ASSIGNED`) | Requerido       | El turno debe existir en el tenant y tener `estado=true`                                                                                                                                                         |
| `REST`     | Sí (`type=REST`)     | Debe ser `null` | Descanso explícito registrado por un usuario                                                                                                                                                                     |
| `BASE`     | **No**               | —               | Se calcula en el response cuando no existe fila para `(employeeId, workDate)`. No hay concepto de "turno por defecto del empleado" — `BASE` es únicamente el estado de fallback visual ("Descanso + Turno Base") |

**Consistencia a nivel de base de datos**: además de la validación en el service, se agregó un `CHECK` constraint en la migración (`turno_assignments_type_turno_check`) que impide filas inconsistentes (`ASSIGNED` sin `turnoId`, o `REST` con `turnoId`) incluso si se escribe directo por SQL.

**Unicidad**: `@@unique([tenantId, employeeId, workDate])` — el POST hace `upsert` sobre esta clave (reasignar = sobrescribir la fila existente del mismo día).

**Decisión: hard delete (no soft delete).** `TurnoAssignment` no tiene `deletedAt`, a diferencia de la regla general de `CLAUDE.md`. Se decidió así por precedente directo en el mismo dominio: `AttendanceLog` y `UserLocation` tampoco tienen soft delete — son registros operativos/de programación diaria, no entidades de negocio persistentes. La trazabilidad no se pierde: cada creación, reasignación, descanso y eliminación queda en `AuditLog` (oldValue/newValue), que es el mecanismo real de auditoría exigido por AC10.

---

## Backend

Extiende el módulo existente `apps/api/src/turnos/` (no se creó un módulo nuevo):

- `interfaces/turno-assignments.interfaces.ts`
- `repository/turno-assignments.repository.ts`
- `service/turno-assignments.service.ts`
- `controller/turno-assignments.controller.ts` (+ DTOs en `controller/dto/`)
- `turno-assignments.utils.ts` (fechas: `getMondayOfWeek`, `buildWeekDates`, `parseDateOnly`, `formatDateOnly`)

### Endpoints

| Método   | Ruta                                                                                     | Descripción                                                                                                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/turnos/asignaciones?weekStart=YYYY-MM-DD&search=&field=nombre\|documento&page=&limit=` | Vista semanal paginada por colaborador. `weekStart` se normaliza siempre al lunes de esa semana.                                                                                                                                      |
| `POST`   | `/turnos/asignaciones`                                                                   | Upsert por `(tenantId, employeeId, workDate)`. Body: `{ employeeId, workDate, turnoId?, type? }`. Mismo endpoint sirve para asignar (`type` omitido o `ASSIGNED` + `turnoId`) y para marcar descanso (`type: 'REST'`, sin `turnoId`). |
| `DELETE` | `/turnos/asignaciones/:id`                                                               | Hard delete de la asignación explícita — la celda vuelve a `BASE` en el próximo `GET`.                                                                                                                                                |

### Validaciones (service)

- Empleado existe en el tenant y `isActive=true` (404 / 409).
- Turno (si `type=ASSIGNED`) existe en el tenant y `estado=true` (404 / 409).
- `turnoId` obligatorio si `type=ASSIGNED`; debe estar ausente si `type=REST` (400).
- Fecha pasada (`workDate < hoy UTC`): bloqueada con 403 salvo `OWNER`/`SUPER_ADMIN`. Aplica a `POST` y `DELETE`.
- Scoping por sede (ver abajo).

---

## RBAC / Permisos

Nuevos permisos (seed en `apps/api/prisma/seed.ts`, ids `054`/`055`):

| Código                               | Descripción                                   |
| ------------------------------------ | --------------------------------------------- |
| `attendance.turnos.assignment.read`  | Ver la vista semanal                          |
| `attendance.turnos.assignment.write` | Asignar, reasignar, marcar descanso, eliminar |

| Rol                      | Read | Write | Scoping                                                                 |
| ------------------------ | ---- | ----- | ----------------------------------------------------------------------- |
| `OWNER` / `SUPER_ADMIN`  | ✅   | ✅    | Todas las sedes                                                         |
| `SUPERVISOR` / `MANAGER` | ✅   | ✅    | **Solo sedes en `UserLocation`**                                        |
| `NOMINA`                 | ✅   | ❌    | Todas las sedes (lectura tenant-wide, igual que el resto de Asistencia) |
| `OPERATOR`               | ❌   | ❌    | Sin acceso                                                              |

Guard dual (mismo patrón que el catálogo de Turnos): `RolesGuard` (`@Roles`) + `PermissionsGuard` (`@RequirePermission`).

### Supervisor/Manager por sede

`TurnoAssignmentsService` resuelve `allowedLocationIds` vía `UserLocationsService.getActiveUserLocations(tenantId, userId)` cuando el rol es `SUPERVISOR`/`MANAGER`:

- `GET`: filtra `EmployeeDetails.locationId IN (allowedLocationIds)` — un supervisor sin sedes asignadas ve una lista vacía (no error).
- `POST`/`DELETE`: si `employee.locationId` no está en `allowedLocationIds` → `403 ForbiddenException`.

---

## AuditLog

Toda mutación (`POST` de asignación/reasignación/descanso, `DELETE`) se registra con `AuditAction.ASSIGN` (instrucción explícita del ticket: usar `ASSIGN` de forma uniforme para las 4 operaciones, incluida la eliminación — conceptualmente "revertir a BASE" también es un cambio de estado de asignación). `oldValue`/`newValue` incluyen `employeeId`, `workDate`, `turnoId`/`turnoSigla` y `type`, antes/después. Persistencia en la misma transacción Prisma que la escritura (`$transaction`), igual que el patrón ya usado en `TurnosRepository`.

---

## Frontend

- Ruta `/asistencia/turnos/asignacion` reemplaza el redirect placeholder — apunta a `AsignacionTurnosScreen`.
- Se agregó `TurnosSubNav` (tabs "Listado de Turnos" / "Asignación de Turnos") en ambas pantallas para que el usuario pueda moverse entre el catálogo y la asignación — antes no existía ningún enlace entre ellas.
- Grilla semanal: colaborador (checkbox + nombre en mayúsculas + documento) × 7 días (lunes-domingo). Colores: normal gris/blanco, sábado amarillo suave, descanso/base verde claro, día actual con borde azul.
- Buscador por nombre/documento, navegación semanal (Anterior/Siguiente/Hoy), contador "Seleccionados (N)".
- Click en celda abre `AssignmentCellModal`: seleccionar turno activo o marcar descanso; si ya hay asignación explícita, permite "Quitar asignación" (vuelve a `BASE`). Si la fecha es pasada y el rol no tiene permiso de override, el modal se muestra en modo solo lectura.
- Mutaciones vía React Query (`useAssignTurnoMutation`, `useDeleteAssignmentMutation`) invalidan la query semanal — la celda se actualiza sin recargar la página completa.

---

## Riesgos / decisiones que quedaron documentadas pero no resueltas

1. ~~**Gap preexistente detectado (no corregido, fuera de alcance):** los permisos `attendance.turnos.read`/`attendance.turnos.write` del catálogo de Turnos (NOM-08) nunca se agregaron a `PERMISSION_SEEDS`/`ROLE_PERMISSION_MATRIX` en `seed.ts`...~~
   **[CORREGIDO — follow-up OS-582]** Se agregaron `attendance.turnos.read` (id `056`) y `attendance.turnos.write` (id `057`) a `PERMISSION_SEEDS` y a `ROLE_PERMISSION_MATRIX` en `apps/api/prisma/seed.ts`: `OWNER`/`SUPER_ADMIN` (read+write, vía `ALL_PERMISSION_CODES`), `SUPERVISOR`/`MANAGER`/`NOMINA` (solo read), `OPERATOR` (sin acceso).
   **[CORREGIDO — segundo follow-up OS-582]** La inconsistencia seed/`RolesGuard` quedó resuelta: `TURNOS_READ_ROLES` en `turnos.constants.ts` ahora es `[...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER', 'NOMINA']`, alineado con los roles sembrados para `attendance.turnos.read`. `TURNOS_WRITE_ROLES` no cambió (`[...SYSTEM_ADMIN_ROLES]` — solo `OWNER`/`SUPER_ADMIN` crean/editan/desactivan turnos). `OPERATOR` sigue sin acceso al catálogo (no está en `TURNOS_READ_ROLES` ni tiene el permiso sembrado). Con ambos fixes, `OWNER`/`SUPER_ADMIN`/`SUPERVISOR`/`MANAGER`/`NOMINA` pueden consultar el catálogo de Turnos sin 403.
2. **Gap preexistente detectado (no corregido):** NOM-08 no agregó ninguna carpeta a la colección Postman ni datos de seed para `Turno` (catálogo vacío por defecto). La colección de OS-582 (ver abajo) crea su propio turno de prueba antes de probar la asignación.
3. `AttendancePage.test.tsx` estaba roto en `main` desde el merge de NOM-08 (el mock de `@/features/attendance` no incluía `AttendanceDashboardScreen`/`TurnosListScreen`). Se corrigió como parte de este cambio, ya que se tocó el mismo archivo.
4. La vista solo soporta orden por nombre ascendente (heredado del `orderBy` del repository) — no hay UI de ordenamiento adicional, ya que no se pidió más de un criterio.

---

## QA — casos a validar manualmente

- Supervisor sin sedes asignadas ve la grilla vacía (no error) y no puede asignar nada.
- Supervisor con sede propia puede asignar/reasignar/marcar descanso solo a colaboradores de esa sede; 403 al intentar fuera de sede.
- Intentar asignar un turno `estado=false` → 409.
- Intentar asignar/eliminar en una fecha pasada como `SUPERVISOR`/`MANAGER`/`NOMINA` → 403; como `OWNER`/`SUPER_ADMIN` → permitido.
- Eliminar una asignación explícita → la celda vuelve a mostrar "Descanso + Turno Base".
- `NOMINA` ve la grilla pero no puede abrir el modal de edición (banner de solo lectura).
