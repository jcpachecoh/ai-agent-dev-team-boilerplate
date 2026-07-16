# CONN-12 Task 02 — Servicio y API de aprobación semanal

**Domain:** `[BACKEND]` `[RBAC]`  
**Status:** `completed`  
**Depends on:** task-01  
**Epic:** [CONN-12](./00-epic-and-decisions.md)

---

## Goal

Exponer el ciclo submit → approve / reject de la planeación semanal con RBAC: admin de sede arma; gerente de operaciones aprueba.

---

## Scope

### Operaciones de servicio

| Método                                             | Comportamiento                                              |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `getOrCreatePlan(tenantId, locationId, weekStart)` | Draft por defecto                                           |
| `submitForApproval(...)`                           | DRAFT/REJECTED → PENDING_APPROVAL; snapshot actor/timestamp |
| `approve(...)`                                     | PENDING → APPROVED; solo rol gerente ops (D2)               |
| `reject(..., reason)`                              | PENDING → REJECTED                                          |
| `assertPlanOperational(...)`                       | Helper para consumidores: true solo si APPROVED             |

### API REST (propuesta)

| Método | Ruta                                            | Rol         |
| ------ | ----------------------------------------------- | ----------- |
| `GET`  | `/turnos/planes-semanales?locationId&weekStart` | read turnos |
| `POST` | `/turnos/planes-semanales/:id/submit`           | write sede  |
| `POST` | `/turnos/planes-semanales/:id/approve`          | approve ops |
| `POST` | `/turnos/planes-semanales/:id/reject`           | approve ops |

- `tenantId` solo desde JWT / header de tenant — nunca del body.
- Permisos nuevos o reutilizados: documentar en `rbac` / constants de turnos.

### Estructura NestJS

Extender `apps/api/src/turnos/`:

- `interfaces/` — contratos plan + status
- `repository/` — Prisma access
- `service/` — reglas de negocio + excepciones HTTP
- `controller/` + `dto/`
- `test/` — unit tests service (mock repo)

---

## Out of scope

- UI (task 07).
- Filtro en CONN-11 (task 04) — solo exponer `assertPlanOperational` / query helper.
- Same-day (task 05).

---

## Files allowed

- `apps/api/src/turnos/**` (interfaces, repository, service, controller, dto, test, module)
- Constants/RBAC de turnos o attendance estrictamente necesarios para el permiso de approve
- Este archivo de tarea

## Files forbidden

- Frontend web-app
- `schema.prisma` / migrations (salvo fix menor acordado)
- `packages/`
- Marcación manual / CONN-06

---

## Acceptance criteria

- [x] Solo roles autorizados aprueban/rechazan (`MANAGER` + admins).
- [x] Submit desde draft/rejected; approve solo desde pending.
- [x] Tests unitarios del servicio (happy path + forbidden + transición inválida).
- [x] `node scripts/validate-structure.js` OK si se toca módulo.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=api exec jest src/turnos/test --silent
pnpm --filter=api exec tsc --noEmit
```
