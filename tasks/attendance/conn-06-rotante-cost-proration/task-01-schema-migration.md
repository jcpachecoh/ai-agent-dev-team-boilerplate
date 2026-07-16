# CONN-06 Task 01 — Schema Prisma y migración

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** —  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Agregar `ROTANTE` al enum `CostCenter`, crear modelo `DailyCostCenterAssignment` con enum `AssignmentSource`, hacer `EmployeeDetails.locationId` nullable para rotantes, y generar migración SQL.

---

## Scope

### Enum `CostCenter`

Agregar valor:

```prisma
ROTANTE
```

### Enum `AssignmentSource`

```prisma
enum AssignmentSource {
  TURNO_ASIGNADO
  MARCACION_ASISTENCIA
  MANUAL
}
```

### Modelo `DailyCostCenterAssignment`

| Campo        | Tipo / notas                                          |
| ------------ | ----------------------------------------------------- |
| `tenantId`   | String, índice obligatorio                            |
| `employeeId` | FK `EmployeeDetails.id`, `onDelete: Restrict`         |
| `date`       | DateTime `@db.Date` — día calendario de la asignación |
| `locationId` | FK `Location.id`, `onDelete: Restrict`                |
| `shiftId`    | String? — ID turno CONN-03 si la fuente fue turno     |
| `source`     | `AssignmentSource`                                    |
| `createdAt`  | DateTime `@default(now())`                            |
| `updatedAt`  | DateTime `@updatedAt`                                 |

Constraints:

- `@@unique([tenantId, employeeId, date])`
- `@@index([tenantId, employeeId, date])`
- `@@index([tenantId, locationId, date])`

### Cambio `EmployeeDetails`

- `locationId String` → `locationId String?`
- Relación `location` → `Location?` con `onDelete` alineado al resto del modelo.

### Relaciones inversas

- `EmployeeDetails.dailyCostCenterAssignments DailyCostCenterAssignment[]`
- `Location.dailyCostCenterAssignments DailyCostCenterAssignment[]`

### Migración SQL

- `ALTER TYPE "CostCenter" ADD VALUE 'ROTANTE'`
- Crear tabla `DailyCostCenterAssignment` con FKs e índices.
- Alterar `EmployeeDetails.locationId` a nullable (sin backfill obligatorio).

---

## Out of scope

- Lógica de resolución automática (task 04).
- Validación de negocio create/update empleado (task 05).
- Seeds de demo rotantes (opcional en task 08 si se necesita QA).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**/migration.sql` (nueva migración)

---

## Files forbidden

- `package.json`, `pnpm-lock.yaml`
- Código de servicios/controllers (tasks posteriores)
- `apps/web-app/**`
- Migraciones no relacionadas

---

## Acceptance criteria

- [x] `CostCenter` incluye `ROTANTE` en schema y cliente generado.
- [x] Tabla `DailyCostCenterAssignment` existe con unique `(tenantId, employeeId, date)`.
- [x] `EmployeeDetails.locationId` es nullable en schema.
- [x] Migración aplica sin errores en entorno dev.

---

## Validation commands

```bash
pnpm prisma format --schema=apps/api/prisma/schema.prisma
DATABASE_URL="<dev-url>" pnpm prisma validate --schema=apps/api/prisma/schema.prisma
pnpm prisma generate --schema=apps/api/prisma/schema.prisma
```
