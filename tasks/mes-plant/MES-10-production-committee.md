# MES-10 — Comité de Producción (Production Committee)

**Ticket:** MES-10  
**Branch:** `feature/mes-plant-production-committee`  
**Status:** Planned  
**Priority:** High

---

## Goal

Introducir el modelo **Comité de Producción** para agrupar la creación de órdenes de producción (OP) bajo un comité con consecutivo único (`OP0001`, `OP0002`, …), miembros con rol global `OPERATIONS_ADMIN`, estado del comité y contador de OPs creadas.

---

## Scope

- Prisma: `ProductionCommittee`, `ProductionCommitteeMember`, enum de estado, FK opcional en `ProductionOrder`.
- Rol global `OPERATIONS_ADMIN` en seed (tenant-scoped `roles`).
- Repository, service, DTOs y rutas REST en `apps/api/src/mes/plant/`.
- Validación: solo usuarios con `role.code === 'OPERATIONS_ADMIN'` pueden ser miembros.
- Generación atómica de consecutivo `OP####` por tenant.
- Incremento de `ordersCount` al crear OP vinculada al comité.
- Tests unitarios de servicio y repositorio.
- Tarea web separada: `tasks/web-app/produccion/00-epic-production-committee.md`.

**Prerequisites:**

- MES-05: `ProductionOrder`, lifecycle de órdenes.
- USR-01/USR-02: `User`, `Role`, RBAC global.

---

## Out of Scope

- UI web completa (epic web aparte).
- Flujo de aprobación multi-firma del comité.
- Notificaciones por email/Slack al abrir comité.
- Cambios en `apps/plant` (tablet operario).
- `lint:fix`, formateo repo-wide.

---

## Modelo de datos (resumen)

| Campo / relación | Tipo                            | Notas                                                |
| ---------------- | ------------------------------- | ---------------------------------------------------- |
| `id`             | cuid                            | PK                                                   |
| `tenantId`       | String                          | Scoping multi-tenant                                 |
| `number`         | String                          | Consecutivo `OP0001`… único por `(tenantId, number)` |
| `status`         | `ProductionCommitteeStatus`     | Ver task 00                                          |
| `ordersCount`    | Int                             | Default 0; incrementa al crear OP en el comité       |
| `memberUserIds`  | vía `ProductionCommitteeMember` | Solo `User` con rol `OPERATIONS_ADMIN`               |
| `createdAt`      | DateTime                        | Auto                                                 |
| `updatedAt`      | DateTime                        | Auto `@updatedAt`                                    |

`ProductionOrder.committeeId` (nullable FK) vincula cada OP al comité que la originó.

---

## Route Contracts (preview)

Todas las rutas requieren JWT MES; tenant desde `req.user.tenantId`.

| Method | Path                              | RBAC        | Description                          |
| ------ | --------------------------------- | ----------- | ------------------------------------ |
| POST   | `/api/plant/committees`           | SUPERVISOR+ | Crear comité + miembros              |
| GET    | `/api/plant/committees`           | Any MES     | Listar con filtros `status`          |
| GET    | `/api/plant/committees/:id`       | Any MES     | Detalle con miembros y `ordersCount` |
| PATCH  | `/api/plant/committees/:id`       | SUPERVISOR+ | Actualizar status / miembros         |
| POST   | `/api/plant/committees/:id/close` | SUPERVISOR+ | `ACTIVE` → `CLOSED`                  |

`POST /api/plant/orders` acepta `committeeId` opcional; si se envía, valida comité `ACTIVE` e incrementa `ordersCount`.

---

## Subtareas

| #   | Archivo                                                                                                                            | Descripción                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 00  | [MES-10-production-committee/00-epic-and-decisions.md](./MES-10-production-committee/00-epic-and-decisions.md)                     | Decisiones bloqueadas + checklist |
| 01  | [MES-10-production-committee/01-schema-migration.md](./MES-10-production-committee/01-schema-migration.md)                         | Prisma + migración + seed rol     |
| 02  | [MES-10-production-committee/02-repository-service.md](./MES-10-production-committee/02-repository-service.md)                     | Repository + `CommitteeService`   |
| 03  | [MES-10-production-committee/03-api-controller-dtos.md](./MES-10-production-committee/03-api-controller-dtos.md)                   | DTOs, controller, rutas           |
| 04  | [MES-10-production-committee/04-orders-committee-integration.md](./MES-10-production-committee/04-orders-committee-integration.md) | `createOrder` + `committeeId`     |
| 05  | [MES-10-production-committee/05-tests.md](./MES-10-production-committee/05-tests.md)                                               | Tests servicio, repo, controller  |

**Frontend:** `tasks/web-app/produccion/00-epic-production-committee.md`

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
pnpm --filter=api prisma migrate dev
```
