# Epic: Locations — GraphQL CRUD de sedes

**Domain:** `[BE]` `[GRAPHQL]` `[LOCATIONS]`  
**Branch sugerida:** `feat/locations-graphql-crud`  
**Status:** `pending`  
**Priority:** High

---

## Goal

Implementar el módulo NestJS `LocationsModule` con **resolvers GraphQL** y **service** para el CRUD de sedes (`Location`), aplicando siempre el filtro por restaurante/tenant y respetando las convenciones del proyecto:

- Multi-tenancy (`tenantId` / `restaurantId`)
- Soft deletes (`deletedAt`)
- Paginación cursor-based
- `@UseGuards(JwtAuthGuard)` en resolvers de negocio
- Excepciones NestJS (`NotFoundException`, `ForbiddenException`, `ConflictException`)

---

## Terminología — `restaurantId` vs `tenantId`

En la API GraphQL del ticket se usa **`restaurantId`** (lenguaje de producto).

En Prisma/DB el campo existente es **`tenantId`** (`locations.tenant_id`).

| Capa GraphQL                             | Capa Prisma / Service |
| ---------------------------------------- | --------------------- |
| `restaurantId`                           | `tenantId`            |
| `Location.restaurantId` (field expuesto) | `Location.tenantId`   |

**Regla:** el resolver recibe `restaurantId` en args/input, lo valida contra el JWT (`user.tenantId`) y delega al service/repository como `tenantId`. Nunca confiar en un `restaurantId` del cliente sin cruzarlo con el contexto autenticado.

---

## Estado actual del schema

Modelo `Location` en `apps/api/prisma/schema.prisma` (parcial):

```prisma
model Location {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  code      String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ...
}
```

**Gap vs requerimiento del ticket:**

| Campo / artefacto                | Estado actual      |
| -------------------------------- | ------------------ |
| `name`                           | ✅ existe          |
| `address`                        | ❌ falta           |
| `city`                           | ❌ falta           |
| `phone`                          | ❌ falta           |
| `latitude` / `longitude`         | ❌ falta           |
| `restaurantId` / `tenantId`      | ✅ `tenantId` + FK |
| `isActive`                       | ✅ existe          |
| `deletedAt` (soft delete)        | ❌ falta           |
| `UserLocation` (User ↔ Location) | ❌ falta           |

Task 01 define el schema; Task 01b aplica migración + seed.

### Modelo objetivo (Prisma)

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

> `UserLocation` es fundación de datos. El CRUD GraphQL de este epic **no** expone asignaciones usuario-sede (tarea futura si aplica).

---

## API GraphQL requerida

```graphql
type Query {
  locations(restaurantId: String!, cursor: String, take: Int): LocationConnection!
  location(id: String!, restaurantId: String!): Location!
}

type Mutation {
  createLocation(input: CreateLocationInput!): Location!
  updateLocation(id: String!, input: UpdateLocationInput!): Location!
  deleteLocation(id: String!): Boolean! # soft delete
  toggleLocationStatus(id: String!): Location!
}
```

### Inputs

| Input                 | Campos                                                  |
| --------------------- | ------------------------------------------------------- |
| `CreateLocationInput` | `name*`, `address*`, `city?`, `phone?`, `restaurantId*` |
| `UpdateLocationInput` | `name?`, `address?`, `city?`, `phone?`, `isActive?`     |

### Connection

```graphql
type LocationConnection {
  edges: [LocationEdge!]!
  pageInfo: PageInfo!
}

type LocationEdge {
  node: Location!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

---

## Estructura del módulo

```
apps/api/src/locations/
├── interfaces/
│   └── locations.interfaces.ts
├── repository/
│   └── locations.repository.ts
├── service/
│   └── locations.service.ts
├── resolver/
│   ├── locations.resolver.ts
│   └── dto/
│       ├── create-location.input.ts
│       ├── update-location.input.ts
│       ├── location.type.ts
│       └── location-connection.type.ts
├── test/
│   ├── locations.repository.spec.ts
│   ├── locations.service.spec.ts
│   └── locations.resolver.spec.ts
└── locations.module.ts
```

---

## Subtask Breakdown

| #   | File                  | Title                                          | Depends on | Status |
| --- | --------------------- | ---------------------------------------------- | ---------- | ------ |
| 1   | `01-schema.md`        | Prisma — `Location` + `UserLocation` en schema | —          | Done   |
| 2   | `01b-migration.md`    | Migración SQL + seed (≥2 sedes/tenant)         | 01         | Done   |
| 3   | `02-interfaces.md`    | Interfaces TypeScript                          | 01         | Done   |
| 4   | `03-repository.md`    | `LocationsRepository` + unit tests             | 02         | Done   |
| 5   | `04-service.md`       | `LocationsService` + unit tests (>80%)         | 03         | Done   |
| 6   | `05-dtos.md`          | GraphQL types + InputTypes + Connection        | 02         | Done   |
| 7   | `06-resolver.md`      | `LocationsResolver` — queries y mutations      | 04, 05     | Done   |
| 8   | `07-module-wiring.md` | `LocationsModule` + `AppModule`                | 03–06      | Done   |

### Orden de ejecución

```
01-schema → 01b-migration → 02-interfaces → 03-repository → 04-service → 05-dtos → 06-resolver → 07-module-wiring
```

La migración (01b) debe completarse antes de probar contra DB real en dev/staging. Los unit tests (03–07) pueden avanzar con Prisma mockeado tras Task 01 + `prisma generate`.

---

## Acceptance Criteria (Epic-level)

### Datos (Tasks 01 + 01b)

- [ ] Schema `Location` + `UserLocation` validado (`prisma validate`)
- [ ] Migración aplicada sin errores en dev (`migrate dev`) y staging (`migrate deploy`)
- [ ] `tenantId` con FK e índice en `locations`
- [ ] Índice en `deletedAt` para filtrar soft deletes
- [ ] Seed con ≥ 2 locations por tenant, con `address` poblado

### GraphQL CRUD (Tasks 02–07)

- [ ] `locations` devuelve `LocationConnection` con paginación cursor-based (`take + 1`, `hasNextPage`, `endCursor`)
- [ ] `location` devuelve una sede por `id` filtrada por `restaurantId` / `tenantId`
- [ ] `createLocation` crea sede con `tenantId` derivado de `input.restaurantId` validado contra JWT
- [ ] `updateLocation` actualiza campos opcionales respetando tenant
- [ ] `deleteLocation` hace soft delete (`deletedAt = now()`), nunca hard delete
- [ ] `toggleLocationStatus` invierte `isActive` de la sede
- [ ] Todos los resolvers usan `@UseGuards(JwtAuthGuard)`
- [ ] `restaurantId` validado en cada operación (mismatch → `ForbiddenException`)
- [ ] Recurso inexistente o de otro tenant → `NotFoundException`
- [ ] Unit tests del service con cobertura > 80%
- [ ] `node scripts/validate-structure.js` pasa
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=locations` pasa

---

## Validation commands (epic)

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=locations --coverage
```

---

## Epic relacionado

| Epic       | Archivo                                | Descripción                                                      |
| ---------- | -------------------------------------- | ---------------------------------------------------------------- |
| **LOC-02** | `08-epic-user-location-assignments.md` | Asignación/desasignación usuario ↔ sede (`UserLocation` GraphQL) |
