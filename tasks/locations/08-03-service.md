# LOC-02 Task 08-03 — `UserLocationsService`

## Goal

Implementar reglas de negocio para asignación/desasignación con validación cross-tenant y errores NestJS.

**Depends on:** Task 08-02 (repository).

---

## Scope

- Crear `apps/api/src/locations/service/user-locations.service.ts`.
- Implementar `IUserLocationsService`.
- Unit tests — **énfasis en casos cross-tenant** y constraint único.

---

## Out of scope

- No resolver, DTOs GraphQL ni module wiring.
- No migraciones.

---

## Files allowed

- `apps/api/src/locations/service/user-locations.service.ts` — create
- `apps/api/src/locations/test/user-locations.service.spec.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### `assertTenantAccess(jwtTenantId, requestedRestaurantId)`

Reutilizar patrón de `LocationsService` — `ForbiddenException` si mismatch.

### `assign(tenantId, userId, locationId)`

1. `findUserForTenant` → `NotFoundException('Usuario no encontrado')` si null.
2. Si `!user.isActive` → `BadRequestException('No se puede asignar un usuario inactivo')`.
3. `findLocationForTenant` → `NotFoundException('Sede no encontrada')` si null.
4. **No** rechazar por `location.isActive === false` (vínculo histórico permitido).
5. `createAssignment` → capturar `P2002` → `ConflictException('El usuario ya está asignado a esta sede')`.

### `remove(tenantId, userId, locationId)`

1. `findAssignment` → `NotFoundException` si no existe.
2. `deleteAssignment` → retornar `true`.

### `getLocationUsers(tenantId, locationId, activeOnly = true)`

1. Verificar sede existe → `NotFoundException`.
2. `findUsersByLocation(tenantId, locationId, activeOnly)`.

### `getUserLocations(tenantId, userId)`

1. Verificar usuario existe → `NotFoundException`.
2. `findLocationsByUser(tenantId, userId)`.

---

## Tests requeridos (cross-tenant y validación)

| Test                                         | Excepción / resultado      |
| -------------------------------------------- | -------------------------- |
| `assertTenantAccess` mismatch                | `ForbiddenException`       |
| `assign` usuario no encontrado (otro tenant) | `NotFoundException`        |
| `assign` sede no encontrada (otro tenant)    | `NotFoundException`        |
| `assign` usuario inactivo                    | `BadRequestException`      |
| `assign` duplicado `(userId, locationId)`    | `ConflictException`        |
| `assign` happy path                          | retorna `UserLocation`     |
| `assign` sede inactiva pero no eliminada     | ✅ permitido               |
| `remove` vínculo inexistente                 | `NotFoundException`        |
| `remove` happy path                          | `true`                     |
| `getLocationUsers` solo activos por defecto  | `activeOnly: true` al repo |
| `getUserLocations` usuario otro tenant       | `NotFoundException`        |

---

## Acceptance criteria

- [ ] `UserLocationsService` implementa `IUserLocationsService`.
- [ ] Validación cross-tenant cubierta en tests.
- [ ] `ConflictException` en duplicado `userId + locationId`.
- [ ] Cobertura del service **> 80%**.
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=user-locations.service --coverage --collectCoverageFrom='src/locations/service/user-locations.service.ts'
```
