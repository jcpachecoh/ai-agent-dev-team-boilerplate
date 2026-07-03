# MES-10 Task 02 — Repository & Committee Service

## Goal

Implementar acceso a datos y reglas de negocio del comité de producción: consecutivo `OP####`, validación de miembros y CRUD.

**Depends on:** Task 01  
**Blocks:** Tasks 03–04

---

## Scope

- Extender `plant.repository.ts` (o `committee.repository.ts`) con queries transaccionales.
- Nuevo `CommitteeService` (o métodos en `PlantService`) registrado en `PlantModule`.
- Generación de número de comité.
- Validación rol `OPERATIONS_ADMIN` por `userId`.

---

## Out of Scope

- Controller / DTOs HTTP (task 03).
- Integración `createOrder` (task 04).
- Tests (task 05).

---

## Files allowed

- `apps/api/src/mes/plant/repository/plant.repository.ts` — extend
- `apps/api/src/mes/plant/repository/committee.repository.ts` — create (optional)
- `apps/api/src/mes/plant/service/committee.service.ts` — create
- `apps/api/src/mes/plant/service/plant.service.ts` — extend (optional)
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend
- `apps/api/src/mes/plant/plant.module.ts` — register provider

---

## Files forbidden

- `apps/api/src/mes/plant/controller/**`
- `apps/api/prisma/**`
- `apps/web-app/**`
- `postman/**`

---

## Implementation notes

### `generateCommitteeNumber(tenantId)`

1. Buscar último comité del tenant ordenado por secuencia numérica del sufijo (`OP0001` → 1).
2. Siguiente: `OP` + `padStart(4, '0')`.
3. Límite 9999 → `ConflictException`.
4. Preferir generación **dentro de transacción** de create para evitar colisiones.

Parser de secuencia: regex `/^OP(\d{4})$/i`.

### `createCommittee(tenantId, dto)`

1. Validar `memberUserIds.length >= 1`.
2. Cargar usuarios con `role` incluido; cada uno debe tener `role.code === 'OPERATIONS_ADMIN'` y `isActive`.
3. Usuarios de otro tenant → `BadRequestException`.
4. Transacción:
   - Insert `ProductionCommittee` (`status` default `DRAFT` o `ACTIVE` según DTO).
   - Insert N filas `ProductionCommitteeMember`.
5. Retornar detalle con miembros (id, email, nombre si disponible).

### `listCommittees(tenantId, filters)`

Filtros: `status`, rango `createdAt` opcional. Paginación coherente con `listOrders`.

### `getCommitteeDetail(tenantId, id)`

Incluir: `number`, `status`, `ordersCount`, `createdAt`, `updatedAt`, `members[]`, `orders` count o ids (opcional, no lista completa de OPs en v1).

### `updateCommittee(tenantId, id, dto)`

- Permitir cambiar `status` (transiciones válidas: ver abajo).
- Reemplazar miembros: delete + insert en transacción; misma validación `OPERATIONS_ADMIN`.
- No permitir editar `number` ni `ordersCount` directamente.

**Transiciones de status:**

| From      | To        | Regla                       |
| --------- | --------- | --------------------------- |
| DRAFT     | ACTIVE    | Requiere ≥1 miembro         |
| ACTIVE    | CLOSED    | Permitido                   |
| ACTIVE    | CANCELLED | Solo si `ordersCount === 0` |
| DRAFT     | CANCELLED | Permitido                   |
| CLOSED    | \*        | Bloqueado                   |
| CANCELLED | \*        | Bloqueado                   |

### `closeCommittee(tenantId, id)`

- `ACTIVE` → `CLOSED`.
- Idempotencia: si ya `CLOSED`, retornar detalle sin error.

### `assertCommitteeActiveForOrder(tenantId, committeeId)`

Usado por task 04:

- Comité existe, mismo tenant, `status === ACTIVE`.
- Lanzar `BadRequestException` si no.

### `incrementOrdersCountTx(tx, committeeId)`

`ordersCount: { increment: 1 }` dentro de transacción de create order.

---

## Acceptance criteria

- [ ] Primer comité del tenant → `OP0001`; segundo → `OP0002`.
- [ ] Usuario con rol `SUPERVISOR` rechazado como miembro → 400.
- [ ] `closeCommittee` en `DRAFT` → 400.
- [ ] Tenant isolation en todas las operaciones.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
node scripts/validate-structure.js
```
