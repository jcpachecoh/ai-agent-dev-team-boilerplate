# NOM-08 Task 01 — Prisma schema + migración: Turnos

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** [00-epic-and-decisions.md](./00-epic-and-decisions.md)

---

## Goal

Agregar modelos `Turno` y `TurnoAssignment`, enums `TurnoTipo` / `TurnoJornada`, permisos RBAC en seed y generar la migración SQL.

---

## Scope

- Modificar `apps/api/prisma/schema.prisma`.
- Agregar permisos `attendance.turnos.read` y `attendance.turnos.write` en `apps/api/prisma/seed.ts`.
- Asignar `attendance.turnos.read` al rol `SUPERVISOR` en seed.
- Crear migración Prisma (`pnpm prisma migrate dev --name nom-08-turnos`).
- Ejecutar `prisma format`, `prisma validate`, `prisma generate`.

---

## Out of scope

- Código en `apps/api/src/`.
- `app.module.ts`.
- `package.json` / `pnpm-lock.yaml`.
- Seeds de datos de turnos de ejemplo (opcional; no requerido para AC).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/migrations/**` (solo la migración generada en esta task)

---

## Files forbidden

- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`

---

## Implementation

### Enums

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

### Modelo `Turno`

```prisma
model Turno {
  id              String       @id @default(cuid())
  tenantId        String
  nombre          String       @db.VarChar(100)
  sigla           String       @db.VarChar(30)
  tipo            TurnoTipo
  jornada         TurnoJornada
  horaInicio      String       // HH:mm — validado en service/DTO
  horaFin         String       // HH:mm
  estado          Boolean      @default(true)
  createdByUserId String?
  updatedByUserId String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  createdBy  User? @relation("TurnoCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  updatedBy  User? @relation("TurnoUpdatedBy", fields: [updatedByUserId], references: [id], onDelete: SetNull)
  assignments TurnoAssignment[]

  @@unique([tenantId, sigla])
  @@index([tenantId, estado])
  @@index([tenantId, nombre])
  @@map("turnos")
}
```

Agregar en `User` las relaciones inversas `turnosCreated` / `turnosUpdated` si Prisma lo requiere.

### Modelo `TurnoAssignment` (mínimo para AC 4)

```prisma
model TurnoAssignment {
  id         String   @id @default(cuid())
  tenantId   String
  turnoId    String
  employeeId String
  workDate   DateTime @db.Date
  createdAt  DateTime @default(now())

  turno    Turno           @relation(fields: [turnoId], references: [id])
  employee EmployeeDetails @relation(fields: [employeeId], references: [id])

  @@index([tenantId, turnoId, workDate])
  @@index([tenantId, employeeId, workDate])
  @@map("turno_assignments")
}
```

Agregar relación inversa en `EmployeeDetails` si aplica.

### Permisos (seed)

```typescript
// attendance.turnos.read  — listado + exportar
// attendance.turnos.write — crear, editar, toggle
```

- `SUPER_ADMIN`: ya incluye todos.
- `SUPERVISOR`: agregar solo `attendance.turnos.read`.

---

## Acceptance criteria

- [ ] `Turno` tiene `tenantId`, índices y `@@unique([tenantId, sigla])`.
- [ ] `TurnoAssignment` permite contar asignaciones con `workDate >= hoy`.
- [ ] Migración SQL crea tablas `turnos` y `turno_assignments` con constraints de enum.
- [ ] `prisma validate` y `prisma generate` pasan sin error.
- [ ] Permisos nuevos visibles en seed y asignados a `SUPERVISOR` (read) y `SUPER_ADMIN` (all).

---

## Validation commands

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
```

Opcional (si DB local disponible):

```bash
pnpm prisma migrate dev --name nom-08-turnos
```

---

## Notes

- No ejecutar `migrate deploy` en staging/prod desde esta task.
- Si `User` alcanza límite de relaciones, usar nombres de relación explícitos como en el ejemplo.
