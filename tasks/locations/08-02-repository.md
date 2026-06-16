# LOC-02 Task 08-02 — `UserLocationsRepository`

## Goal

Implementar acceso Prisma para asignaciones `UserLocation` con filtro obligatorio por `tenantId`.

**Depends on:** Task 08-01 (interfaces).

---

## Scope

- Crear `apps/api/src/locations/repository/user-locations.repository.ts`.
- Implementar `IUserLocationsRepository`.
- Unit tests con Prisma mockeado.

---

## Out of scope

- No service, resolver ni DTOs GraphQL.
- No migraciones.

---

## Files allowed

- `apps/api/src/locations/repository/user-locations.repository.ts` — create
- `apps/api/src/locations/test/user-locations.repository.spec.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### `findUserForTenant(tenantId, userId)`

```typescript
return this.prisma.user.findFirst({
  where: { id: userId, tenantId, deletedAt: null },
});
```

### `findLocationForTenant(tenantId, locationId)`

```typescript
return this.prisma.location.findFirst({
  where: { id: locationId, tenantId, deletedAt: null },
});
```

### `createAssignment(tenantId, userId, locationId)`

```typescript
return this.prisma.userLocation.create({
  data: { tenantId, userId, locationId },
});
```

### `deleteAssignment(tenantId, userId, locationId)`

```typescript
await this.prisma.userLocation.deleteMany({
  where: { tenantId, userId, locationId },
});
```

> Usar `deleteMany` + verificar `count` en service, o `delete` con unique `userId_locationId`.

### `findUsersByLocation(tenantId, locationId, activeOnly)`

```typescript
return this.prisma.user.findMany({
  where: {
    tenantId,
    deletedAt: null,
    ...(activeOnly ? { isActive: true } : {}),
    userLocations: { some: { locationId, tenantId } },
  },
  orderBy: { email: 'asc' },
});
```

### `findLocationsByUser(tenantId, userId)`

```typescript
return this.prisma.location.findMany({
  where: {
    tenantId,
    deletedAt: null,
    users: { some: { userId, tenantId } },
  },
  orderBy: { name: 'asc' },
});
```

**Repository rules:**

- Nunca queries sin `tenantId`.
- No lanzar HTTP exceptions.

---

## Tests requeridos

| Test                                                         | Assert                    |
| ------------------------------------------------------------ | ------------------------- |
| `findUserForTenant` filtra `tenantId`, `deletedAt: null`     | `where` correcto          |
| `findLocationForTenant` filtra `tenantId`, `deletedAt: null` | `where` correcto          |
| `createAssignment` persiste con `tenantId`                   | `data.tenantId`           |
| `deleteAssignment` filtra por tenant + user + location       | `where` correcto          |
| `findUsersByLocation` con `activeOnly: true`                 | `isActive: true` en where |
| `findLocationsByUser` excluye `deletedAt` en location        | `deletedAt: null`         |

---

## Acceptance criteria

- [ ] `UserLocationsRepository` implementa `IUserLocationsRepository`.
- [ ] Todas las queries filtran `tenantId`.
- [ ] Tests pasan con Prisma mockeado.
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=user-locations.repository
```
