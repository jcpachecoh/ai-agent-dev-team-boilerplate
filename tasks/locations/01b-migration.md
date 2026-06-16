# LOC-01 Task 01b — Prisma Migration + Seed

## Goal

Crear y aplicar la migración Prisma para el modelo `Location` extendido y la tabla de relación `UserLocation`, con soporte multi-tenant completo. Actualizar el seed con sedes de ejemplo.

**Depends on:** Task 01 (schema completo en `schema.prisma` + `prisma generate`).

---

## Scope

- Generar migración SQL bajo `apps/api/prisma/migrations/`.
- Aplicar en **dev** (`prisma migrate dev`).
- Documentar comando para **staging** (`prisma migrate deploy`).
- Backfill de filas `locations` existentes (columnas nuevas obligatorias).
- Actualizar `seed.ts`: ≥ 2 locations por tenant con `address`, `city`, `phone`.
- Seed opcional de `user_locations` para usuarios seed (owner / operator).

---

## Out of scope

- No modificar `schema.prisma` (ya definido en Task 01).
- No repository, service, resolver ni tests de aplicación.
- No cambiar `package.json` ni `pnpm-lock.yaml`.
- No implementar GraphQL para `UserLocation` (solo fundación de datos).

---

## Files allowed

- `apps/api/prisma/migrations/<timestamp>_locations_user_locations/migration.sql` — create (auto-generado + revisión manual)
- `apps/api/prisma/seed.ts` — actualizar `seedLocations` y agregar `seedUserLocations` si aplica

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- Cualquier archivo en `apps/api/src/`
- Cualquier archivo en `packages/`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`

---

## DDL esperado (resumen)

La migración debe reflejar **solo** los cambios de Task 01:

### Tabla `locations` (ALTER)

| Cambio       | Detalle                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `address`    | `TEXT NOT NULL` — backfill en filas existentes antes de quitar default |
| `city`       | `TEXT NULL`                                                            |
| `phone`      | `TEXT NULL`                                                            |
| `latitude`   | `TEXT NULL`                                                            |
| `longitude`  | `TEXT NULL`                                                            |
| `deleted_at` | `TIMESTAMP NULL`                                                       |
| Índice       | `@@index([deletedAt])` — crear si no existe                            |

`tenant_id` ya tiene FK a `tenants` e índice — **no duplicar** salvo que la revisión muestre que falta.

### Tabla `user_locations` (CREATE)

```sql
-- Estructura objetivo (Prisma genera nombres snake_case)
CREATE TABLE "user_locations" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "location_id" TEXT NOT NULL,
  "tenant_id"  TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id")
);
-- FKs: user_id → users, location_id → locations
-- UNIQUE (user_id, location_id)
-- INDEX (tenant_id), INDEX (location_id)
```

---

## Backfill de datos existentes

Si ya hay filas en `locations` sin `address`:

```sql
-- Ejemplo: default temporal + backfill
ALTER TABLE "locations" ADD COLUMN "address" TEXT NOT NULL DEFAULT '';
UPDATE "locations" SET "address" = COALESCE("name", 'Sin dirección') WHERE "address" = '';
-- Opcional: ALTER COLUMN DROP DEFAULT después del backfill
```

Revisar SQL generado por Prisma y ajustar **solo** si el backfill automático falla en dev.

---

## Seed — criterios

### `seedLocations()`

- Mantener upserts idempotentes (`tenantId_code` unique).
- Cada location debe incluir: `name`, `code`, `address`, `city`, `phone`, `isActive: true`.
- **≥ 2 locations por tenant** seedeado.
  - Hoy el seed tiene un tenant (`palos-de-lena`) con 10 sedes — cumple el mínimo.
  - Si se agrega un segundo tenant al seed, aplicar la misma regla.

Ejemplo de campos nuevos en upsert:

```typescript
create: {
  tenantId: OPERATIONAL_TENANT_ID,
  name,
  code,
  address: `Calle ${i} # 10-20, Bogotá`,
  city: 'Bogotá',
  phone: `+57 300 000 00${i.toString().padStart(2, '0')}`,
  isActive: true,
},
update: {
  name,
  address: `Calle ${i} # 10-20, Bogotá`,
  city: 'Bogotá',
  phone: `+57 300 000 00${i.toString().padStart(2, '0')}`,
  isActive: true,
},
```

### `seedUserLocations()` (opcional pero recomendado)

- Vincular `mes-owner` y `mes-operator` a la primera sede (`locations[0]`).
- Upsert por `(userId, locationId)` con `tenantId: OPERATIONAL_TENANT_ID`.
- Idempotente — no duplicar filas en re-runs.

---

## Staging

Tras merge a rama de staging, aplicar con:

```bash
cd apps/api
pnpm prisma migrate deploy
pnpm prisma db seed
```

No ejecutar `migrate dev` en staging.

---

## Acceptance criteria

- [ ] Archivo de migración existe en `apps/api/prisma/migrations/`.
- [ ] `pnpm prisma migrate dev --name locations_user_locations` exit 0 en dev local.
- [ ] `pnpm prisma validate` exit 0.
- [ ] `pnpm prisma generate` exit 0.
- [ ] SQL revisado manualmente — **solo** DDL de `locations` + `user_locations` (+ índices/FKs relacionados).
- [ ] `tenantId` en `locations` mantiene FK e índice para queries por tenant.
- [ ] Índice en `deletedAt` presente en `locations`.
- [ ] `pnpm prisma db seed` exit 0.
- [ ] Seed deja ≥ 2 locations activas por tenant seedeado, con `address` poblado.
- [ ] Staging: `prisma migrate deploy` documentado / aplicado sin errores.

---

## Validation commands

```bash
cd apps/api
pnpm prisma validate
pnpm prisma migrate dev --name locations_user_locations
pnpm prisma generate
pnpm prisma db seed
```

---

## Risks

| Risk                                   | Mitigación                                                        |
| -------------------------------------- | ----------------------------------------------------------------- |
| `address NOT NULL` en filas existentes | Backfill en migration SQL antes de commit                         |
| `EmployeeDetails.locationId` FK        | No eliminar ni renombrar `locations.id`                           |
| Seed falla por columnas nuevas         | Actualizar `create`/`update` en `seedLocations` en la misma tarea |
| SQL con DDL no relacionado             | Revisar diff de migración antes de commit                         |

---

## Stop rule

**Detener después de esta tarea.** Reportar nombre de migración, resumen SQL, resultado de seed y validación. No continuar a Task 02 sin aprobación explícita.
