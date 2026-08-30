# MES-10 Task 04 — Orders ↔ Committee Integration

## Goal

Permitir crear órdenes de producción bajo un comité activo, vincular `committeeId` y mantener `ordersCount` consistente.

**Depends on:** Tasks 02–03  
**Blocks:** Task 05

---

## Scope

- Extender `CreateOrderDto` con `committeeId` opcional.
- Modificar `createOrder` / `createOrderWithExecutionsTx` para persistir FK e incrementar contador.
- Extender responses de order detail/list con datos del comité.
- Listar OPs por comité (query opcional en `GET /orders`).

---

## Out of Scope

- UI web.
- Cambiar formato del `number` de OP (sigue `0001` de MES-05).
- Tests exhaustivos (task 05).

---

## Files allowed

- `apps/api/src/mes/plant/service/plant.service.ts`
- `apps/api/src/mes/plant/repository/plant.repository.ts`
- `apps/api/src/mes/plant/controller/dto/create-order.dto.ts` (o equivalente)
- `apps/api/src/mes/plant/controller/dto/order-detail.response.ts`
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts`

---

## Files forbidden

- `apps/api/prisma/**` (salvo bugfix migration — no esperado)
- `apps/web-app/**`

---

## Implementation notes

### Create order con comité

1. Si `committeeId` ausente → comportamiento MES-05 sin cambios.
2. Si presente:
   - `CommitteeService.assertCommitteeActiveForOrder(tenantId, committeeId)`.
   - En la misma transacción Prisma:
     - Crear `ProductionOrder` con `committeeId`.
     - Crear phase executions (MES-05).
     - `incrementOrdersCountTx`.
3. Rollback atómico si cualquier paso falla.

### Order detail / list DTO

Agregar campos opcionales:

```typescript
committeeId?: string | null;
committeeNumber?: string | null;  // OP0001
```

Resolver `committeeNumber` con join o include en repository.

### `GET /api/plant/orders`

Query param opcional: `committeeId` — filtra OPs del comité.

### Edge cases

| Caso                                 | Comportamiento                         |
| ------------------------------------ | -------------------------------------- |
| Comité `CLOSED`                      | 400 al crear OP                        |
| Comité `DRAFT`                       | 400 al crear OP                        |
| `committeeId` inválido / otro tenant | 404 o 400                              |
| OP cancelada                         | **No** decrementar `ordersCount` en v1 |

Decisión v1 (D6): `ordersCount` = total OPs **creadas** bajo el comité, incluidas canceladas. Documentar en comentario de servicio.

---

## Acceptance criteria

- [ ] `POST /orders` con `committeeId` válido → OP con FK + `ordersCount` +1.
- [ ] `POST /orders` sin `committeeId` → sin regresión MES-05.
- [ ] `GET /orders?committeeId=...` retorna solo OPs del comité.
- [ ] Order detail expone `committeeNumber` cuando aplica.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant.service
```
