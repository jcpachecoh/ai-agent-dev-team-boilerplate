# EMP-POS-01 Task 01 — Prisma Schema: `EmployeePosition` + historial

## Goal

Agregar modelos `EmployeePosition` y `EmployeePositionHistory`, y la FK `positionId` en `EmployeeDetails`. Ejecutar format, validate y generate.

**Depends on:** Ninguna.

---

## Scope

- Modificar `apps/api/prisma/schema.prisma` únicamente.
- Ejecutar `prisma format`, `prisma validate`, `prisma generate`.

---

## Out of scope

- Migración SQL (Task 01b).
- Código en `apps/api/src/`.
- Cambios a `package.json` / `pnpm-lock.yaml`.

---

## Files allowed

- `apps/api/prisma/schema.prisma`

---

## Files forbidden

- `apps/api/src/**`
- `packages/**`
- Migraciones existentes
- `package.json` / `pnpm-lock.yaml`

---

## Implementation

### Relación en `EmployeeDetails`

```prisma
model EmployeeDetails {
  // ... campos existentes ...
  positionId String?
  position   String          // mantener como snapshot del título
  // ...
  positionRef EmployeePosition? @relation(fields: [positionId], references: [id], onDelete: SetNull)
  positionHistory EmployeePositionHistory[]
}
```

### Modelo `EmployeePosition`

```prisma
model EmployeePosition {
  id               String   @id @default(cuid())
  tenantId         String
  title            String
  area             String
  baseSalaryRange  Decimal  @db.Decimal(12, 2)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  employees EmployeeDetails[]
  history   EmployeePositionHistory[]

  @@unique([tenantId, title])
  @@index([tenantId, isActive])
  @@index([tenantId, area])
  @@map("employee_positions")
}
```

### Modelo `EmployeePositionHistory`

```prisma
model EmployeePositionHistory {
  id                String    @id @default(cuid())
  tenantId          String
  employeeDetailsId String
  positionId        String
  effectiveFrom     DateTime  @default(now())
  effectiveTo       DateTime?
  changedBy         String?
  createdAt         DateTime  @default(now())

  employee EmployeeDetails  @relation(fields: [employeeDetailsId], references: [id], onDelete: Cascade)
  position EmployeePosition @relation(fields: [positionId], references: [id], onDelete: Restrict)

  @@index([tenantId, employeeDetailsId])
  @@index([tenantId, positionId])
  @@index([employeeDetailsId, effectiveFrom])
  @@map("employee_position_history")
}
```

**Design decisions:**

- `baseSalaryRange` — valor de referencia del cargo (no nómina calculada del empleado).
- `position` string en `EmployeeDetails` se conserva para compatibilidad; el service lo sincroniza desde `EmployeePosition.title`.
- `onDelete: SetNull` en `positionId` — desactivar cargo no borra empleados.
- `onDelete: Restrict` en historial → posición no se puede hard-delete si tiene historial (MVP no hard-delete).
- `@@unique([tenantId, title])` — evita duplicados "Contador" en el mismo tenant.

---

## Acceptance criteria

- [ ] `EmployeePosition` mapeado a `employee_positions`.
- [ ] `EmployeePositionHistory` mapeado a `employee_position_history`.
- [ ] `EmployeeDetails.positionId` opcional con relación `positionRef`.
- [ ] `npx prisma format` exit 0.
- [ ] `npx prisma validate` exit 0.
- [ ] `npx prisma generate` exit 0.
- [ ] No se creó migración.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
