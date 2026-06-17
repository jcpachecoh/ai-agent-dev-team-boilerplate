# MES-10 Task 01 — Schema & Migration

## Goal

Agregar modelos Prisma para comité de producción, miembros, enum de estado y FK en `ProductionOrder`. Sembrar rol `OPERATIONS_ADMIN`.

**Depends on:** Task 00 decisions  
**Blocks:** Tasks 02–05

---

## Scope

- Actualizar `apps/api/prisma/schema.prisma`.
- Generar y aplicar migración.
- Extender `apps/api/prisma/seed.ts` con rol `OPERATIONS_ADMIN`.
- Regenerar Prisma client.

---

## Out of Scope

- Lógica de servicio/repositorio (task 02).
- Rutas HTTP (task 03).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts` (solo bloque rol `OPERATIONS_ADMIN`)

---

## Files forbidden

- `apps/api/src/**`
- `apps/web-app/**`

---

## Implementation

### 1. Enum `ProductionCommitteeStatus`

```prisma
enum ProductionCommitteeStatus {
  DRAFT
  ACTIVE
  CLOSED
  CANCELLED
}
```

### 2. Model `ProductionCommittee`

| Column      | Type                      | Notes             |
| ----------- | ------------------------- | ----------------- |
| id          | cuid                      | PK                |
| tenantId    | String                    | index             |
| number      | String                    | `OP0001` format   |
| status      | ProductionCommitteeStatus | default `DRAFT`   |
| ordersCount | Int                       | default 0         |
| createdAt   | DateTime                  | `@default(now())` |
| updatedAt   | DateTime                  | `@updatedAt`      |

Constraints:

```prisma
@@unique([tenantId, number])
@@index([tenantId, status])
@@map("production_committees")
```

Relations:

```prisma
members ProductionCommitteeMember[]
orders  ProductionOrder[]
```

### 3. Model `ProductionCommitteeMember`

| Column      | Type     | Notes                             |
| ----------- | -------- | --------------------------------- |
| id          | cuid     | PK                                |
| committeeId | String   | FK → ProductionCommittee, cascade |
| userId      | String   | FK → User                         |
| createdAt   | DateTime | `@default(now())`                 |

```prisma
@@unique([committeeId, userId])
@@index([committeeId])
@@index([userId])
@@map("production_committee_members")
```

### 4. Extend `ProductionOrder`

```prisma
committeeId String?
committee   ProductionCommittee? @relation(fields: [committeeId], references: [id])

@@index([committeeId])
```

Nullable — OPs existentes sin comité no requieren backfill.

### 5. Extend `User` (relation only)

```prisma
committeeMemberships ProductionCommitteeMember[]
```

### 6. Seed — rol `OPERATIONS_ADMIN`

En `seed.ts`:

- Nuevo constante `ROLE_OPERATIONS_ADMIN_ID` (UUID fijo, patrón existente).
- Entrada en array de roles: `{ code: 'OPERATIONS_ADMIN', name: 'Administrador de Operaciones' }`.
- Permisos iniciales (ajustar en USR follow-up si hace falta):
  - `plant.orders.read`
  - `plant.committees.read` (nuevo permiso — crear en catálogo si no existe)

Si `plant.committees.*` no está en catálogo de permisos, agregar en el mismo seed:

- `plant.committees.read`
- `plant.committees.manage`

Y asignar `manage` a `OWNER` / `SUPERVISOR`; `read` a `OPERATIONS_ADMIN`.

### 7. Migration notes

- Tablas nuevas; columnas nullable en `production_orders`.
- Sin backfill de comités para OPs históricas.
- Documentar en comentario SQL: consecutivo comité independiente del `number` de OP.

---

## Acceptance criteria

- [ ] `pnpm --filter api prisma migrate dev` exitoso localmente.
- [ ] Prisma client incluye `ProductionCommittee`, `ProductionCommitteeMember`, enum.
- [ ] `pnpm db:seed` crea rol `OPERATIONS_ADMIN` idempotente.
- [ ] OPs existentes siguen consultables sin `committeeId`.
