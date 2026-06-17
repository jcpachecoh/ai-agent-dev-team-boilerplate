# LOC-01 Task 02 — Interfaces TypeScript

## Goal

Definir los contratos del módulo `locations` antes de implementar repository y service.

**Depends on:** Task 01 (`prisma generate` con schema actualizado).

> Task 01b (migration) no bloquea esta tarea — solo tipos TS. Recomendada antes de pruebas manuales contra DB.

---

## Scope

- Crear `apps/api/src/locations/interfaces/locations.interfaces.ts`.
- Definir tipos de paginación cursor-based y DTOs de dominio (sin decoradores GraphQL).

---

## Out of scope

- No repository, service, resolver ni module.
- No tests.

---

## Files allowed

- `apps/api/src/locations/interfaces/locations.interfaces.ts` — create

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
import type { Location } from '@prisma/client';

export interface LocationCursorPage {
  items: Location[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface CreateLocationData {
  name: string;
  address: string;
  city?: string | null;
  phone?: string | null;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
  city?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export interface ILocationsRepository {
  findMany(tenantId: string, cursor?: string, take?: number): Promise<Location[]>;
  findById(tenantId: string, id: string): Promise<Location | null>;
  create(tenantId: string, data: CreateLocationData): Promise<Location>;
  update(tenantId: string, id: string, data: UpdateLocationData): Promise<Location>;
  softDelete(tenantId: string, id: string): Promise<void>;
  toggleStatus(tenantId: string, id: string): Promise<Location>;
}

export interface ILocationsService {
  findAll(tenantId: string, cursor?: string, take?: number): Promise<LocationCursorPage>;
  findOne(tenantId: string, id: string): Promise<Location>;
  create(tenantId: string, data: CreateLocationData): Promise<Location>;
  update(tenantId: string, id: string, data: UpdateLocationData): Promise<Location>;
  delete(tenantId: string, id: string): Promise<boolean>;
  toggleStatus(tenantId: string, id: string): Promise<Location>;
  assertTenantAccess(jwtTenantId: string, requestedRestaurantId: string): void;
}
```

**Design decisions:**

- Repository recibe siempre `tenantId` — nunca expone queries sin filtro de tenant.
- `findMany` retorna array crudo; el service calcula `hasNextPage` / `endCursor` con patrón `take + 1`.
- `assertTenantAccess` centraliza validación `restaurantId` (GraphQL) vs `tenantId` (JWT).
- Repository no lanza HTTP exceptions; service sí.

---

## Acceptance criteria

- [ ] `ILocationsRepository` exportada con 6 métodos.
- [ ] `ILocationsService` exportada con 7 métodos incluyendo `assertTenantAccess`.
- [ ] `LocationCursorPage`, `CreateLocationData`, `UpdateLocationData` exportados.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
