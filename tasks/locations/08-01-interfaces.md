# LOC-02 Task 08-01 — Interfaces `UserLocation`

## Goal

Definir contratos TypeScript para asignación usuario ↔ sede antes de repository y service.

**Depends on:** Epic LOC-01 completado (`UserLocation` en Prisma + `prisma generate`).

---

## Scope

- Crear `apps/api/src/locations/interfaces/user-locations.interfaces.ts`.
- Tipos de dominio sin decoradores GraphQL.

---

## Out of scope

- No repository, service, resolver ni tests.
- No cambios a `schema.prisma` ni migraciones.

---

## Files allowed

- `apps/api/src/locations/interfaces/user-locations.interfaces.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
import type { Location, User, UserLocation } from '@prisma/client';

export type UserLocationWithRelations = UserLocation & {
  user?: User;
  location?: Location;
};

export interface IUserLocationsRepository {
  findAssignment(
    tenantId: string,
    userId: string,
    locationId: string,
  ): Promise<UserLocation | null>;
  createAssignment(tenantId: string, userId: string, locationId: string): Promise<UserLocation>;
  deleteAssignment(tenantId: string, userId: string, locationId: string): Promise<void>;
  findUsersByLocation(tenantId: string, locationId: string, activeOnly: boolean): Promise<User[]>;
  findLocationsByUser(tenantId: string, userId: string): Promise<Location[]>;
  findUserForTenant(tenantId: string, userId: string): Promise<User | null>;
  findLocationForTenant(tenantId: string, locationId: string): Promise<Location | null>;
}

export interface IUserLocationsService {
  assign(tenantId: string, userId: string, locationId: string): Promise<UserLocation>;
  remove(tenantId: string, userId: string, locationId: string): Promise<boolean>;
  getLocationUsers(tenantId: string, locationId: string, activeOnly?: boolean): Promise<User[]>;
  getUserLocations(tenantId: string, userId: string): Promise<Location[]>;
  assertTenantAccess(jwtTenantId: string, requestedRestaurantId: string): void;
}
```

**Design decisions:**

- Repository siempre filtra por `tenantId` en queries.
- `findUserForTenant` / `findLocationForTenant` incluyen `deletedAt: null` en user/location.
- `findLocationsByUser` excluye sedes con `deletedAt != null`; **no** filtra `isActive` (vínculo histórico).
- `activeOnly` en `findUsersByLocation` filtra `isActive: true` y `deletedAt: null` en `User`.

---

## Acceptance criteria

- [ ] `IUserLocationsRepository` con 7 métodos exportados.
- [ ] `IUserLocationsService` con 5 métodos exportados.
- [ ] `UserLocationWithRelations` exportado.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
