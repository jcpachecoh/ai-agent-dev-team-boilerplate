# LOC-01 Task 03 — `LocationsRepository`

## Goal

Implementar acceso a datos Prisma para `Location` con filtro obligatorio por `tenantId` y soft delete.

**Depends on:** Task 01 (schema), Task 02 (interfaces). Task 01b recomendada para dev/staging con DB real.

---

## Scope

- Crear `apps/api/src/locations/repository/locations.repository.ts`.
- Implementar `ILocationsRepository`.
- Unit tests con Prisma mockeado.

---

## Out of scope

- No service, resolver, module ni DTOs GraphQL.
- No migraciones.

---

## Files allowed

- `apps/api/src/locations/repository/locations.repository.ts` — create
- `apps/api/src/locations/test/locations.repository.spec.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### `findMany(tenantId, cursor?, take = 20)`

```typescript
return this.prisma.location.findMany({
  where: { tenantId, deletedAt: null },
  take: take + 1,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  orderBy: { createdAt: 'desc' },
});
```

### `findById(tenantId, id)`

```typescript
return this.prisma.location.findFirst({
  where: { id, tenantId, deletedAt: null },
});
```

### `softDelete(tenantId, id)`

```typescript
await this.prisma.location.update({
  where: { id, tenantId },
  data: { deletedAt: new Date() },
});
```

### `toggleStatus(tenantId, id)`

Leer registro, invertir `isActive`, persistir. Retornar entidad actualizada.

**Repository rules:**

- Nunca `prisma.location.delete()`.
- Nunca `findMany` sin `tenantId`.
- No lanzar `NotFoundException` — retornar `null` o dejar que Prisma falle en update si no existe.

---

## Tests requeridos (`locations.repository.spec.ts`)

| Test                                              | Assert                   |
| ------------------------------------------------- | ------------------------ |
| `findMany` filtra `tenantId` y `deletedAt: null`  | `where` correcto         |
| `findMany` usa `take + 1` para cursor pagination  | `take: take + 1`         |
| `findMany` con cursor incluye `skip: 1`           | cursor pattern           |
| `findById` filtra `tenantId`, `deletedAt: null`   | `where` correcto         |
| `create` persiste con `tenantId` del argumento    | `data.tenantId`          |
| `softDelete` setea `deletedAt`, no llama `delete` | `update` con `deletedAt` |
| `toggleStatus` invierte `isActive`                | `isActive: !current`     |

---

## Acceptance criteria

- [ ] `LocationsRepository` implementa `ILocationsRepository`.
- [ ] Todas las queries filtran `tenantId` y `deletedAt: null` donde aplica.
- [ ] Soft delete vía `update({ deletedAt })`.
- [ ] Tests pasan con Prisma mockeado (sin DB real).
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=locations.repository
```
