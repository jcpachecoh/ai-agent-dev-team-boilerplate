# LOC-01 Task 06 — `LocationsResolver`

## Goal

Exponer queries y mutations GraphQL para el CRUD de sedes con autenticación JWT y validación de `restaurantId`.

**Depends on:** Task 04 (service), Task 05 (DTOs).

---

## Scope

- Crear `apps/api/src/locations/resolver/locations.resolver.ts`.
- Implementar las 6 operaciones GraphQL del epic.
- Unit tests del resolver con service mockeado.

---

## Out of scope

- No module wiring (Task 07).
- No migraciones.

---

## Files allowed

- `apps/api/src/locations/resolver/locations.resolver.ts` — create
- `apps/api/src/locations/test/locations.resolver.spec.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts` (Task 07)
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Guards y contexto

```typescript
@Resolver(() => LocationType)
@UseGuards(JwtAuthGuard)
export class LocationsResolver {
  constructor(private readonly locationsService: LocationsService) {}
```

Inyectar `@CurrentUser() user: JwtPayload` en cada handler.

### Validación `restaurantId`

En cada operación que reciba `restaurantId` (args o input):

```typescript
this.locationsService.assertTenantAccess(user.tenantId, restaurantId);
```

Para `createLocation`:

```typescript
this.locationsService.assertTenantAccess(user.tenantId, input.restaurantId);
return this.locationsService.create(user.tenantId, {
  name: input.name,
  address: input.address,
  city: input.city,
  phone: input.phone,
});
```

Para `updateLocation`, `deleteLocation`, `toggleLocationStatus` — solo `user.tenantId` (no `restaurantId` en args del ticket). El service filtra por `tenantId` del JWT.

### Queries

| Operation   | Args                                | Return               |
| ----------- | ----------------------------------- | -------------------- |
| `locations` | `restaurantId!`, `cursor?`, `take?` | `LocationConnection` |
| `location`  | `id!`, `restaurantId!`              | `Location`           |

Mapear `LocationCursorPage` → `LocationConnectionType`:

```typescript
edges: page.items.map((node) => ({
  node: toLocationType(node),
  cursor: node.id,
})),
pageInfo: {
  hasNextPage: page.hasNextPage,
  endCursor: page.endCursor,
},
```

### Mutations

| Operation              | Args                                 | Return     |
| ---------------------- | ------------------------------------ | ---------- |
| `createLocation`       | `input: CreateLocationInput!`        | `Location` |
| `updateLocation`       | `id!`, `input: UpdateLocationInput!` | `Location` |
| `deleteLocation`       | `id!`                                | `Boolean`  |
| `toggleLocationStatus` | `id!`                                | `Location` |

Todas las respuestas de `Location` pasan por `toLocationType()`.

---

## Tests requeridos (`locations.resolver.spec.ts`)

| Test                                                  | Assert                      |
| ----------------------------------------------------- | --------------------------- |
| `locations` llama `assertTenantAccess` + `findAll`    | service mocked              |
| `locations` mapea `LocationConnection` correctamente  | edges + pageInfo            |
| `location` valida tenant y retorna `LocationType`     | `restaurantId` en response  |
| `createLocation` valida `input.restaurantId` vs JWT   | `assertTenantAccess` called |
| `updateLocation` delega a service con `user.tenantId` | —                           |
| `deleteLocation` retorna `true`                       | —                           |
| `toggleLocationStatus` retorna location mapeada       | —                           |

---

## Acceptance criteria

- [ ] 2 queries y 4 mutations implementadas según contrato del epic.
- [ ] `@UseGuards(JwtAuthGuard)` a nivel de clase o método.
- [ ] `restaurantId` validado donde el contrato lo exige.
- [ ] Respuestas mapean `tenantId` → `restaurantId`.
- [ ] Tests del resolver pasan.
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=locations.resolver
```
