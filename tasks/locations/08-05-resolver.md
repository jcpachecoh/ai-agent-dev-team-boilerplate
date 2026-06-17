# LOC-02 Task 08-05 — `UserLocationsResolver`

## Goal

Exponer queries y mutations GraphQL para asignación usuario ↔ sede.

**Depends on:** Task 08-03 (service), Task 08-04 (DTOs).

---

## Scope

- Crear `apps/api/src/locations/resolver/user-locations.resolver.ts`.
- Implementar 2 queries + 2 mutations del epic.
- Unit tests con service mockeado.

---

## Out of scope

- No module wiring (Task 08-06).
- No migraciones.

---

## Files allowed

- `apps/api/src/locations/resolver/user-locations.resolver.ts` — create
- `apps/api/src/locations/test/user-locations.resolver.spec.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts` (Task 08-06)
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
@UseGuards(JwtAuthGuard)
@Resolver()
export class UserLocationsResolver {
  constructor(private readonly userLocationsService: UserLocationsService) {}
```

### Mutations

| Operation                | Args                     | Return         | Validación               |
| ------------------------ | ------------------------ | -------------- | ------------------------ |
| `assignUserToLocation`   | `userId!`, `locationId!` | `UserLocation` | JWT `tenantId` implícito |
| `removeUserFromLocation` | `userId!`, `locationId!` | `Boolean`      | JWT `tenantId` implícito |

```typescript
@Mutation(() => UserLocationType, { name: 'assignUserToLocation' })
async assignUserToLocation(
  @CurrentUser() user: JwtPayload,
  @Args('userId', { type: () => ID }) userId: string,
  @Args('locationId', { type: () => ID }) locationId: string,
): Promise<UserLocationType> {
  const result = await this.userLocationsService.assign(user.tenantId, userId, locationId);
  return toUserLocationType(result);
}
```

### Queries

| Operation       | Args                           | Return                     |
| --------------- | ------------------------------ | -------------------------- |
| `locationUsers` | `locationId!`, `restaurantId!` | `[LocationAssignedUser!]!` |
| `userLocations` | `userId!`, `restaurantId!`     | `[Location!]!`             |

En ambas queries:

```typescript
this.userLocationsService.assertTenantAccess(user.tenantId, restaurantId);
```

`locationUsers` — llamar service con `activeOnly: true` (default).

Mapear resultados con `toLocationAssignedUserType` / `toLocationType`.

---

## Tests requeridos

| Test                                                            | Assert                     |
| --------------------------------------------------------------- | -------------------------- |
| `assignUserToLocation` delega con `user.tenantId`               | service mocked             |
| `removeUserFromLocation` retorna `true`                         | —                          |
| `locationUsers` llama `assertTenantAccess` + `getLocationUsers` | `restaurantId` validado    |
| `locationUsers` mapea `LocationAssignedUserType`                | `restaurantId` en response |
| `userLocations` valida tenant y mapea `LocationType`            | —                          |

---

## Acceptance criteria

- [ ] 2 queries y 2 mutations según contrato del epic.
- [ ] `@UseGuards(JwtAuthGuard)` a nivel de clase.
- [ ] `restaurantId` validado en queries.
- [ ] Tests del resolver pasan.
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=user-locations.resolver
```
