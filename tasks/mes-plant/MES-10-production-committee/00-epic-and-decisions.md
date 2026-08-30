# MES-10 Task 00 — Epic & Locked Decisions

## Goal

Documentar decisiones bloqueadas para el comité de producción antes de implementar tasks 01–05.

**References:** `../MES-10-production-committee.md`

---

## Scope

- Decision log + checklist del epic.
- Reconciliación con `ProductionOrder` existente (MES-05).

---

## Out of Scope

- Código de aplicación.
- Migraciones.

---

## Files allowed

- `tasks/mes-plant/MES-10-production-committee/00-epic-and-decisions.md` (this file)

---

## Files forbidden

- Everything under `apps/api/src/`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Locked decisions

| #   | Decision                   | Value                                                                                                                             |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Nombre tabla / modelo      | `ProductionCommittee` → `production_committees`                                                                                   |
| D2  | Consecutivo comité         | Formato **`OP` + 4 dígitos** (`OP0001`…`OP9999`); único por `(tenantId, number)`; generado en servicio con lock transaccional     |
| D3  | Miembros                   | Tabla puente **`ProductionCommitteeMember`** (`committeeId`, `userId`); mínimo 1 miembro al crear                                 |
| D4  | Rol de miembros            | Solo `User` cuyo `Role.code === 'OPERATIONS_ADMIN'` (rol global USR, no `OperationalRole`)                                        |
| D5  | Status enum                | `DRAFT`, `ACTIVE`, `CLOSED`, `CANCELLED` — default `DRAFT`; solo `ACTIVE` permite crear OP                                        |
| D6  | `ordersCount`              | Columna denormalizada en comité; `+1` en la misma transacción que `createOrder` cuando `committeeId` presente                     |
| D7  | Vínculo OP                 | `ProductionOrder.committeeId` nullable FK → `ProductionCommittee`; OP sin comité sigue flujo MES-05 actual                        |
| D8  | Número OP vs número comité | **Independientes**: comité `OP0001`; orden individual conserva `number` secuencial `0001` de MES-05 (sin prefijo `OP`)            |
| D9  | Módulo API                 | Extender `apps/api/src/mes/plant/`                                                                                                |
| D10 | Auth / RBAC                | MES JWT; mutaciones comité `SUPERVISOR+`; list/detail cualquier MES autenticado                                                   |
| D11 | Cerrar comité              | `POST .../close` o `PATCH status=CLOSED`; rechazar nuevas OP si `status !== ACTIVE`                                               |
| D12 | Seed rol                   | Agregar `OPERATIONS_ADMIN` en `apps/api/prisma/seed.ts` (task 01); permisos mínimos: `plant.orders.read`, `plant.committees.read` |

---

## Epic checklist

### Schema (task 01)

- [ ] `ProductionCommitteeStatus` enum
- [ ] `ProductionCommittee` con `number`, `status`, `ordersCount`, timestamps
- [ ] `ProductionCommitteeMember` junction
- [ ] `ProductionOrder.committeeId` nullable FK
- [ ] Rol `OPERATIONS_ADMIN` en seed
- [ ] Migración aplicada

### Repository & service (task 02)

- [ ] `generateCommitteeNumber(tenantId)` → `OP0001`
- [ ] CRUD comité + validación miembros `OPERATIONS_ADMIN`
- [ ] Transacción create comité + members

### API (task 03)

- [ ] `POST /api/plant/committees`
- [ ] `GET /api/plant/committees`
- [ ] `GET /api/plant/committees/:id`
- [ ] `PATCH /api/plant/committees/:id`
- [ ] `POST /api/plant/committees/:id/close`

### Orders integration (task 04)

- [ ] `CreateOrderDto.committeeId` opcional
- [ ] Validar comité `ACTIVE` + incrementar `ordersCount`
- [ ] Detalle OP incluye `committeeId` y `committeeNumber` (opcional)

### Tests (task 05)

- [ ] Consecutivo `OP0002` tras `OP0001`
- [ ] Rechazo miembro sin rol `OPERATIONS_ADMIN`
- [ ] `ordersCount` incrementa al crear OP
- [ ] validate-structure + typecheck pass

### Web (externo)

- [ ] `tasks/web-app/produccion/00-epic-production-committee.md`

---

## Acceptance criteria

- [ ] Todas las decisiones D1–D12 respetadas en tasks 01–05.
- [ ] Ninguna task contradice D8 (números OP y comité separados) sin actualizar este documento.
