# LOC-01 Task 01 — Prisma Schema: `Location` + `UserLocation`

## Goal

Extender `Location` y agregar el modelo `UserLocation` en `apps/api/prisma/schema.prisma` con soporte multi-tenant, soft delete y coordenadas. Ejecutar `format`, `validate` y `generate`.

**Depends on:** ninguna.

**Blocks:** Task 01b (migration + seed).

**Status:** ✅ Done

---

## Scope

- Extender model `Location`: `address`, `city`, `phone`, `latitude`, `longitude`, `deletedAt`.
- Crear model `UserLocation` (relación User ↔ Location).
- Agregar relación `userLocations` en `User`.
- Agregar índice en `deletedAt`.
- Ejecutar `prisma format`, `prisma validate`, `prisma generate`.

---

## Out of scope

- No crear migración (`prisma migrate dev`) — eso es Task 01b.
- No modificar `seed.ts`.
- No repository, service, resolver ni tests.
- No modificar `app.module.ts`.
- No cambiar `package.json` ni `pnpm-lock.yaml`.

---

## Files allowed

- `apps/api/prisma/schema.prisma` — modificar `Location`, `User`; agregar `UserLocation`

---

## Files forbidden

- Cualquier archivo en `apps/api/src/`
- Cualquier archivo en `packages/`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation

### `Location` (modelo objetivo)

```prisma
model Location {
  id        String    @id @default(cuid())
  tenantId  String
  name      String
  address   String
  city      String?
  phone     String?
  code      String?
  latitude  String?
  longitude String?
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  tenant          Tenant            @relation(fields: [tenantId], references: [id])
  users           UserLocation[]
  employeeDetails EmployeeDetails[]

  @@unique([tenantId, name])
  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([deletedAt])
  @@map("locations")
}
```

### `UserLocation` (nuevo)

```prisma
model UserLocation {
  id         String   @id @default(cuid())
  userId     String
  locationId String
  tenantId   String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([userId, locationId])
  @@index([tenantId])
  @@index([locationId])
  @@map("user_locations")
}
```

### `User` — agregar relación

```prisma
userLocations UserLocation[]
```

---

## Design decisions

| Decisión                                 | Razón                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `tenantId` en Prisma (no `restaurantId`) | Convención multi-tenant del monorepo                                         |
| Conservar `code`                         | Seed y `EmployeeDetails` ya lo usan                                          |
| `latitude` / `longitude` como `String?`  | Coherente con ticket original; evita precisión Decimal innecesaria en MVP    |
| `address` obligatorio en DB              | Service valida en create; migration hace backfill (Task 01b)                 |
| `tenantId` en `UserLocation`             | Filtro de tenant sin join extra en queries de asignación                     |
| `UserLocation` fuera del CRUD GraphQL    | Fundación de datos; API GraphQL de sedes no expone asignaciones en este epic |

---

## Acceptance criteria

- [x] `Location` incluye `address`, `city`, `phone`, `latitude`, `longitude`, `deletedAt`.
- [x] `UserLocation` creado con FKs, unique `(userId, locationId)` e índices.
- [x] `User.userLocations` relación agregada.
- [x] `@@index([tenantId])` y `@@index([deletedAt])` en `Location`.
- [x] `npx prisma format` exit 0.
- [x] `npx prisma validate` exit 0.
- [x] `npx prisma generate` exit 0.
- [x] No se creó migración en esta tarea.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
