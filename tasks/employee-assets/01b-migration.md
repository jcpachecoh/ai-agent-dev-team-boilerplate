# OS-558 Task 01b — Migración SQL: tabla `employee_assets`

## Goal

Crear la migración Prisma que genera la tabla `employee_assets` y el enum `asset_status` en PostgreSQL.

**Depends on:** Task 01 (schema actualizado y `prisma generate` exitoso).

---

## Scope

- Ejecutar `prisma migrate dev` para generar el archivo SQL de migración.
- Verificar el SQL generado antes de aplicar.

---

## Out of scope

- Backfill de datos (no hay datos previos de activos).
- Cambios al schema (Task 01).
- Cambios a `apps/api/src/`.

---

## Files allowed

- `apps/api/prisma/migrations/**` (nuevo archivo generado)

---

## Implementation

```bash
cd apps/api
npx prisma migrate dev --name add-employee-assets
```

### SQL esperado

```sql
-- CreateEnum
CREATE TYPE "asset_status" AS ENUM ('ACTIVO', 'RETORNADO', 'DADO_DE_BAJA');

-- CreateEnum
CREATE TYPE "asset_type" AS ENUM ('EDUCATIONAL', 'FINANCIAL', 'LEGAL', 'DEPENDANTS');

-- CreateTable
CREATE TABLE "employee_assets" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "employeeId"      TEXT NOT NULL,
    "assetName"       TEXT NOT NULL,
    "type"            "asset_type" NOT NULL,
    "assignmentDate"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value"           DECIMAL(12,2) NOT NULL,
    "status"          "asset_status" NOT NULL DEFAULT 'ACTIVO',
    "notes"           TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_assets_tenantId_idx" ON "employee_assets"("tenantId");
CREATE INDEX "employee_assets_employeeId_idx" ON "employee_assets"("employeeId");
CREATE INDEX "employee_assets_tenantId_status_idx" ON "employee_assets"("tenantId", "status");
CREATE INDEX "employee_assets_employeeId_status_idx" ON "employee_assets"("employeeId", "status");
CREATE INDEX "employee_assets_tenantId_type_idx" ON "employee_assets"("tenantId", "type");

-- AddForeignKey
ALTER TABLE "employee_assets"
  ADD CONSTRAINT "employee_assets_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Acceptance criteria

- [ ] Archivo de migración generado en `apps/api/prisma/migrations/`.
- [ ] SQL contiene `CREATE TYPE "asset_status"` con los 3 valores.
- [ ] SQL contiene `CREATE TYPE "asset_type"` con `EDUCATIONAL`, `FINANCIAL`, `LEGAL`, `DEPENDANTS`.
- [ ] SQL contiene `CREATE TABLE "employee_assets"` con todos los campos.
- [ ] FK hacia `employee_details` presente.
- [ ] Los 4 índices creados.
- [ ] `npx prisma migrate dev` exit 0 en entorno local.
- [ ] `npx prisma migrate deploy` puede aplicarse en staging sin error.

---

## Validation commands

```bash
cd apps/api
npx prisma migrate dev --name add-employee-assets
npx prisma studio  # verificar tabla vacía visible en GUI
```
