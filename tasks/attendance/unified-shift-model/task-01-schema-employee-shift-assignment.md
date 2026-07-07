# SHIFT-UNI Task 01 — Schema: turno por sede + asignación vigente por empleado

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** [00-epic-and-decisions.md](./00-epic-and-decisions.md), NOM-08 (modelo `Turno` base), LOC (modelo `Location`)

---

## Goal

Extender el catálogo `Turno` con alcance por sede y días de semana, y crear `EmployeeShiftAssignment` para vigencia por empleado. Generar migración SQL.

---

## Scope

- Modificar `apps/api/prisma/schema.prisma`:
  - `Turno`: agregar `locationId` (FK `Location`), `daysOfWeek Int[]` (default `[1,2,3,4,5]` o según decisión de producto).
  - Nuevo modelo `EmployeeShiftAssignment`.
  - Relaciones inversas en `Location`, `EmployeeDetails`.
- Crear migración Prisma (`pnpm prisma migrate dev --name shift_uni_employee_assignment`).
- Ejecutar `prisma format`, `prisma validate`, `prisma generate`.
- Script de backfill documentado en comentario de migración o README de task (turnos existentes sin `locationId`).

---

## Out of scope

- Código en `apps/api/src/`.
- `app.module.ts`, `seed.ts` (salvo permisos nuevos si se definen en épica — por defecto reutilizar `attendance.turnos.*`).
- Frontend.
- Lógica de resolución de turno (Task 02).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**` (solo migración de esta task)

---

## Files forbidden

- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/prisma/seed.ts` (salvo que épica exija permisos nuevos)
- `apps/api/src/app.module.ts`

---

## Implementation

### Extensión `Turno`

```prisma
model Turno {
  // ...campos existentes...
  locationId  String
  daysOfWeek  Int[]    @default([1, 2, 3, 4, 5]) // 0=dom … 6=sáb

  location              Location                  @relation(fields: [locationId], references: [id])
  employeeAssignments   EmployeeShiftAssignment[]

  @@index([tenantId, locationId])
}
```

- `locationId` **NOT NULL** tras backfill en migración (fase: nullable → backfill → NOT NULL si el equipo prefiere migración segura en dos pasos).
- Mantener `@@unique([tenantId, sigla])` — sigla sigue siendo única por tenant (documentar si producto pide unicidad por sede).

### Nuevo modelo `EmployeeShiftAssignment`

```prisma
model EmployeeShiftAssignment {
  id            String    @id @default(cuid())
  tenantId      String
  employeeId    String
  shiftId       String    // FK Turno.id
  effectiveFrom DateTime  @db.Date
  effectiveTo   DateTime? @db.Date
  createdByUserId String?
  updatedByUserId String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  turno    Turno           @relation(fields: [shiftId], references: [id])
  employee EmployeeDetails @relation(fields: [employeeId], references: [id])
  createdBy User?          @relation("EmployeeShiftAssignmentCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  updatedBy User?          @relation("EmployeeShiftAssignmentUpdatedBy", fields: [updatedByUserId], references: [id], onDelete: SetNull)

  @@index([tenantId, employeeId, effectiveFrom])
  @@index([tenantId, shiftId])
  @@map("employee_shift_assignments")
}
```

**Reglas DB (CHECK o validación en Task 02):**

- `effectiveTo IS NULL OR effectiveTo >= effectiveFrom`
- No solapamiento de vigencias activas para el mismo `(tenantId, employeeId)` — índice parcial o validación en service.

### Backfill turnos existentes

Documentar en la migración:

1. Si hay filas en `turnos` sin `locationId`, asignar sede según política (p. ej. primera `Location` activa del tenant).
2. `daysOfWeek` default laboral Lun–Vie si vacío.

---

## Acceptance criteria

- [ ] `prisma validate` pasa.
- [ ] Migración SQL revisada: FKs, índices `tenantId`, sin drop de `turno_assignments`.
- [ ] `EmployeeShiftAssignment` mapeado a `employee_shift_assignments`.
- [ ] `Turno.locationId` referencia `locations.id`.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api exec prisma format
pnpm --filter=@restopsiq/api exec prisma validate
pnpm --filter=@restopsiq/api exec prisma generate
```
