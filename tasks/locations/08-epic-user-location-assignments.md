# Epic LOC-02: Asignación de usuarios a sedes (`UserLocation`)

**Domain:** `[BE]` `[GRAPHQL]` `[LOCATIONS]` `[USER-LOCATIONS]`  
**Branch sugerida:** `feat/locations-user-assignments`  
**Status:** `pending` → **Done** (implementado)  
**Priority:** High

**Depends on:** Epic LOC-01 (schema `UserLocation`, `LocationsModule`, `LocationType`).

---

## Goal

Implementar la lógica de **asignación y desasignación** de usuarios globales (`User`) a sedes (`Location`), con queries y mutations GraphQL, asegurando filtro multi-tenant en todas las operaciones.

---

## Terminología

| GraphQL         | Prisma                                                   |
| --------------- | -------------------------------------------------------- |
| `restaurantId`  | `tenantId`                                               |
| `User` (ticket) | `User` global (`users` table) — **no** `OperationalUser` |
| `Location`      | `Location`                                               |
| `UserLocation`  | `UserLocation` (tabla join)                              |

> **Colisión de tipos GraphQL:** ya existe `@ObjectType('User')` en `user.resolver.ts` (perfil `OperationalUser`). Para este epic usar **`LocationAssignedUser`** como nombre GraphQL del ObjectType (campos: `id`, `email`, `cedula`, `isActive`, `restaurantId`). Documentar en API como “usuario asignado a sede”.

---

## API GraphQL requerida

```graphql
type Mutation {
  assignUserToLocation(userId: String!, locationId: String!): UserLocation!
  removeUserFromLocation(userId: String!, locationId: String!): Boolean!
}

type Query {
  locationUsers(locationId: String!, restaurantId: String!): [LocationAssignedUser!]!
  userLocations(userId: String!, restaurantId: String!): [Location!]!
}
```

### `UserLocation` ObjectType (respuesta de assign)

| Field          | Origen                    |
| -------------- | ------------------------- |
| `id`           | `UserLocation.id`         |
| `userId`       | `UserLocation.userId`     |
| `locationId`   | `UserLocation.locationId` |
| `restaurantId` | `UserLocation.tenantId`   |
| `createdAt`    | `UserLocation.createdAt`  |

---

## Reglas de negocio

| Regla                            | Comportamiento                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Mismo tenant                     | `User.tenantId` y `Location.tenantId` deben coincidir con JWT `tenantId`                                |
| Multi-sede                       | Un usuario puede tener múltiples `UserLocation` simultáneos                                             |
| Usuario inactivo                 | No asignar si `User.isActive === false` o `User.deletedAt != null` → `BadRequestException`              |
| Usuario otro tenant              | `NotFoundException` (no filtrar cross-tenant)                                                           |
| Sede inactiva                    | **Permitir asignación** — al desactivar sede (`isActive: false`) el vínculo se mantiene                 |
| Sede eliminada (soft)            | No asignar si `Location.deletedAt != null` → `NotFoundException`                                        |
| Duplicado `(userId, locationId)` | `ConflictException` con mensaje amigable                                                                |
| `removeUserFromLocation`         | Hard delete del registro `UserLocation` (tabla join)                                                    |
| `locationUsers`                  | Solo usuarios **activos** (`isActive: true`, `deletedAt: null`) por defecto                             |
| `userLocations`                  | Sedes asignadas no eliminadas (`Location.deletedAt: null`); incluir sedes inactivas (`isActive: false`) |

---

## Estructura del módulo (extensión LOC-01)

```
apps/api/src/locations/
├── interfaces/
│   └── user-locations.interfaces.ts      # NEW
├── repository/
│   └── user-locations.repository.ts      # NEW
├── service/
│   └── user-locations.service.ts         # NEW
├── resolver/
│   ├── user-locations.resolver.ts        # NEW
│   └── dto/
│       ├── user-location.type.ts         # NEW
│       └── location-assigned-user.type.ts # NEW
├── test/
│   ├── user-locations.repository.spec.ts # NEW
│   ├── user-locations.service.spec.ts    # NEW
│   └── user-locations.resolver.spec.ts   # NEW
└── locations.module.ts                   # MODIFY — registrar nuevos providers
```

Reutilizar `LocationType` / `toLocationType` de `resolver/dto/location.type.ts`.

---

## Subtask Breakdown

| #   | File                     | Title                                                           | Depends on   |
| --- | ------------------------ | --------------------------------------------------------------- | ------------ |
| 1   | `08-01-interfaces.md`    | Interfaces `IUserLocationsRepository` / `IUserLocationsService` | LOC-01       |
| 2   | `08-02-repository.md`    | `UserLocationsRepository` + tests                               | 08-01        |
| 3   | `08-03-service.md`       | `UserLocationsService` + tests (cross-tenant)                   | 08-02        |
| 4   | `08-04-dtos.md`          | GraphQL `UserLocationType`, `LocationAssignedUserType`          | 08-01        |
| 5   | `08-05-resolver.md`      | Queries + mutations en `UserLocationsResolver`                  | 08-03, 08-04 |
| 6   | `08-06-module-wiring.md` | Registrar providers en `LocationsModule`                        | 08-02–08-05  |

### Orden

```
08-01 → 08-02 → 08-03 → 08-04 → 08-05 → 08-06
         (08-04 puede ir en paralelo con 08-02/08-03)
```

**No requiere migración Prisma** — tabla `user_locations` ya existe (LOC-01 Task 01b).

---

## Acceptance Criteria (Epic-level)

- [ ] `assignUserToLocation` crea vínculo con `tenantId` del JWT
- [ ] `removeUserFromLocation` elimina vínculo y retorna `true`
- [ ] `locationUsers` lista usuarios activos de la sede (mismo tenant)
- [ ] `userLocations` lista sedes asignadas al usuario (no soft-deleted)
- [ ] Validación cross-tenant: usuario y sede del mismo `restaurantId` / `tenantId`
- [ ] Usuario inactivo o de otro tenant → error apropiado
- [ ] Duplicado `@@unique([userId, locationId])` → `ConflictException` amigable
- [ ] `@UseGuards(JwtAuthGuard)` en todos los resolvers
- [ ] `restaurantId` validado contra JWT en queries
- [ ] Unit tests de validación cross-tenant en service
- [ ] `node scripts/validate-structure.js` pasa
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=user-locations` pasa

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=user-locations --coverage
```
