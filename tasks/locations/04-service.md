# LOC-01 Task 04 — `LocationsService`

## Goal

Implementar reglas de negocio y excepciones HTTP para el CRUD de sedes.

**Depends on:** Task 02 (interfaces), Task 03 (repository).

---

## Scope

- Crear `apps/api/src/locations/service/locations.service.ts`.
- Implementar `ILocationsService`.
- Unit tests con repository mockeado — **cobertura > 80%** del service.

---

## Out of scope

- No resolver, module ni DTOs GraphQL.
- No migraciones.

---

## Files allowed

- `apps/api/src/locations/service/locations.service.ts` — create
- `apps/api/src/locations/test/locations.service.spec.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### `assertTenantAccess(jwtTenantId, requestedRestaurantId)`

```typescript
if (jwtTenantId !== requestedRestaurantId) {
  throw new ForbiddenException('Acceso denegado');
}
```

### `findAll(tenantId, cursor?, take = 20)`

1. Llamar `repository.findMany(tenantId, cursor, take)`.
2. Si `items.length > take` → `hasNextPage = true`, slice a `take` items.
3. `endCursor = items.at(-1)?.id ?? null`.

### `findOne(tenantId, id)`

- `null` del repository → `NotFoundException('Sede {id} no encontrada')`.

### `create(tenantId, data)`

- Validar `name` y `address` no vacíos → `BadRequestException` si faltan.
- Delegar a `repository.create`.

### `update(tenantId, id, data)`

- Verificar existencia → `NotFoundException` si no existe.
- Delegar a `repository.update`.

### `delete(tenantId, id)`

- Verificar existencia → `NotFoundException`.
- `repository.softDelete` → retornar `true`.

### `toggleStatus(tenantId, id)`

- Verificar existencia → `NotFoundException`.
- Delegar a `repository.toggleStatus`.

**Service rules:**

- Nunca aceptar `tenantId` del body sin validar contra JWT (eso lo hace el resolver antes de llamar al service).
- Siempre pasar `tenantId` explícito al repository.

---

## Tests requeridos (`locations.service.spec.ts`)

| Test                           | Excepción / resultado                     |
| ------------------------------ | ----------------------------------------- |
| `assertTenantAccess` mismatch  | `ForbiddenException`                      |
| `assertTenantAccess` match     | no throw                                  |
| `findAll` sin siguiente página | `hasNextPage: false`                      |
| `findAll` con `take+1` items   | `hasNextPage: true`, `endCursor` correcto |
| `findOne` no encontrado        | `NotFoundException`                       |
| `create` sin `address`         | `BadRequestException`                     |
| `create` happy path            | retorna `Location`                        |
| `update` no encontrado         | `NotFoundException`                       |
| `delete` no encontrado         | `NotFoundException`                       |
| `delete` happy path            | retorna `true`, llama `softDelete`        |
| `toggleStatus` no encontrado   | `NotFoundException`                       |
| `toggleStatus` happy path      | retorna location con `isActive` invertido |

---

## Acceptance criteria

- [ ] `LocationsService` implementa `ILocationsService`.
- [ ] Paginación cursor-based con patrón `take + 1`.
- [ ] `ForbiddenException`, `NotFoundException`, `BadRequestException` según tabla.
- [ ] Cobertura del service **> 80%** (`--coverage`).
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=locations.service --coverage --collectCoverageFrom='src/locations/service/**/*.ts'
```
