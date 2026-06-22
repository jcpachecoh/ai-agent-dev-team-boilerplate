# MES-11 Task 02 — Interfaces & DTOs

## Goal

Contratos TypeScript y DTOs Swagger para runtime operario y respuesta de receta.

**Depends on:** Task 00.

---

## Scope

- Interfaces en `plant.interfaces.ts` (o `operator-runtime.interfaces.ts`).
- DTOs request/response en `controller/dto/`.
- Mapper a tipos UI documentados (`OrderRecipeViewResponse`).

---

## Out of Scope

- Lógica de servicio.
- Controller routes.

---

## Files allowed

- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend
- `apps/api/src/mes/plant/interfaces/operator-runtime.interfaces.ts` — create (opcional)
- `apps/api/src/mes/plant/controller/dto/start-order.dto.ts`
- `apps/api/src/mes/plant/controller/dto/operator-pause-order.dto.ts`
- `apps/api/src/mes/plant/controller/dto/complete-step.dto.ts`
- `apps/api/src/mes/plant/controller/dto/finish-order.dto.ts`
- `apps/api/src/mes/plant/controller/dto/order-recipe-view.response.ts`

---

## Files forbidden

- `apps/api/prisma/**`
- `package.json`
- `apps/api/src/app.module.ts`

---

## DTOs

### `StartOrderDto`

- `workStationId: string` (required) — debe coincidir con estación de la fase actual o sesión operario

### `OperatorPauseOrderDto`

- `notes?: string`

### `CompleteStepDto`

- `stepId: string` — `phaseExecutionId`
- `actualMinutes?: number`
- `producedQuantity?: string` (decimal string)
- `notes?: string`

### `FinishOrderDto`

- `notes?: string`

### `OrderRecipeViewResponse`

Alineado con `PlantRecipeDetail`:

- `orderId`, `productName`, `recipeName`, `batchSize`, `stationId`
- `currentPhaseIndex: number`
- `status: 'pending' | 'in_progress' | 'paused'`
- `phases: Array<{ id, index, name, durationMinutes, instruction?, ingredients[], status }>`
- `ingredients[]`: `{ id, name, quantity, unit, supplier?, stockWarning }`
- `elapsedSeconds?: number` (opcional, derivado de logs)

---

## Acceptance criteria

- [ ] Validación `class-validator` en todos los DTOs.
- [ ] Swagger `@ApiProperty` completo.
- [ ] `pnpm --filter api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter api typecheck
```
