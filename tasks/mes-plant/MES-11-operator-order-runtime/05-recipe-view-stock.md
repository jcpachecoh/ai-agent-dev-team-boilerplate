# MES-11 Task 05 — Recipe view + stock

## Goal

`GET /api/plant/orders/:id/recipe` — payload para `PlantRecipeDetailScreen`.

**Depends on:** Tasks 02, 04.

---

## Scope

- `getOrderRecipeView(tenantId, orderId)` en runtime service o `PlantService`.
- Cargar OP + ejecuciones ordenadas por `phase.order`.
- Cargar fases + `PhaseInput` + `SupplyItem` + proveedor principal.
- Escalar cantidades: `quantityPerBatch * batchCount`.
- `stockWarning` si `stockDisponible < required`.
- Derivar `currentPhaseIndex` y `status` UI (`pending` | `in_progress` | `paused`).
- Opcional: `elapsedSeconds` desde logs.

---

## Out of Scope

- Controller wiring (task 06).
- Reserva de stock.

---

## Files allowed

- `apps/api/src/mes/plant/service/operator-order-runtime.service.ts` — extend
- `apps/api/src/mes/plant/repository/plant.repository.ts` — queries read-only si hace falta
- `apps/api/src/mes/plant/controller/dto/order-recipe-view.response.ts`

---

## Files forbidden

- `apps/api/prisma/**`
- `plant.controller.ts` (task 06)

---

## Mapping UI

| UI (`PlantRecipePhase`)   | Backend                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `phase.id`                | `phaseExecutionId` (runtime) o `phaseId` — **usar `phaseExecutionId` como `id` en respuesta** para `complete-step` |
| `phase.index`             | `phase.order` (1-based)                                                                                            |
| `phase.status`            | derivado de `PhaseExecutionStatus`                                                                                 |
| `ingredient.supplier`     | `proveedorPrincipal.razonSocial`                                                                                   |
| `ingredient.stockWarning` | cálculo stock                                                                                                      |

---

## Acceptance criteria

- [ ] Respuesta JSON documentada en Swagger.
- [ ] Orden con 6 fases devuelve 6 items con insumos.
- [ ] Test unitario: stock insuficiente → `stockWarning: true`.
- [ ] `pnpm --filter api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter api test -- order-recipe-view
pnpm --filter api typecheck
```
