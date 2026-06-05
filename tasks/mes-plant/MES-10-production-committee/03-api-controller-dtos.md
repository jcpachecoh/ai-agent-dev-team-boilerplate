# MES-10 Task 03 — API, Controller & DTOs

## Goal

Exponer REST endpoints del comité de producción con DTOs validados y RBAC MES.

**Depends on:** Task 02  
**Blocks:** Task 04 (parcial), task 05

---

## Scope

- DTOs request/response en `apps/api/src/mes/plant/controller/dto/`.
- Rutas en `PlantController` (o `CommitteeController` bajo prefijo `plant`).
- `class-validator` / Zod según convención existente del módulo plant.

---

## Out of Scope

- Cambios en `POST /orders` (task 04).
- Tests (task 05).
- Postman (opcional follow-up).

---

## Files allowed

- `apps/api/src/mes/plant/controller/plant.controller.ts` — extend
- `apps/api/src/mes/plant/controller/dto/**` — new committee DTOs
- `apps/api/src/mes/plant/plant.module.ts` — if new controller

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/web-app/**`

---

## Route contracts

| Method | Path                              | RBAC        | Body / query            |
| ------ | --------------------------------- | ----------- | ----------------------- |
| POST   | `/api/plant/committees`           | SUPERVISOR+ | `CreateCommitteeDto`    |
| GET    | `/api/plant/committees`           | Any MES     | `?status=&page=&limit=` |
| GET    | `/api/plant/committees/:id`       | Any MES     | —                       |
| PATCH  | `/api/plant/committees/:id`       | SUPERVISOR+ | `UpdateCommitteeDto`    |
| POST   | `/api/plant/committees/:id/close` | SUPERVISOR+ | —                       |

Guards: `@Public()` + `MesJwtGuard` + `MesRolesGuard` (patrón MES-05).

---

## DTOs

### `CreateCommitteeDto`

```typescript
{
  memberUserIds: string[];  // min 1, each cuid
  status?: 'DRAFT' | 'ACTIVE';  // default DRAFT
}
```

### `UpdateCommitteeDto`

```typescript
{
  status?: ProductionCommitteeStatus;
  memberUserIds?: string[];  // if provided, replaces all members
}
```

### `CommitteeMemberResponse`

```typescript
{
  userId: string;
  email: string;
  roleCode: string; // always OPERATIONS_ADMIN when valid
}
```

### `CommitteeDetailResponse`

```typescript
{
  id: string;
  tenantId: string;
  number: string;       // OP0001
  status: ProductionCommitteeStatus;
  ordersCount: number;
  members: CommitteeMemberResponse[];
  createdAt: string;
  updatedAt: string;
}
```

### `CommitteeListItemResponse`

Subset: `id`, `number`, `status`, `ordersCount`, `memberCount`, `createdAt`.

---

## Controller notes

- `POST committees`: delegar a `CommitteeService.createCommittee`.
- `GET committees`: mapear lista paginada.
- `GET committees/:id`: `NotFoundException` si tenant mismatch.
- `PATCH`: validar transiciones de status en servicio.
- `POST close`: atajo a `CLOSED` sin body.

Errores en español o inglés según convención plant existente (mantener consistencia con MES-05).

---

## Acceptance criteria

- [ ] Postman/curl: crear comité con 2 `OPERATIONS_ADMIN` → 201 + `number: OP0001`.
- [ ] GET list filtra por `status=ACTIVE`.
- [ ] PATCH miembros reemplaza lista completa.
- [ ] OPERATOR puede GET; no puede POST/PATCH.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.
