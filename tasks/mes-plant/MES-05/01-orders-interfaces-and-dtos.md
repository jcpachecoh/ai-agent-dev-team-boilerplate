# MES-05 Task 01 — Order Interfaces & DTOs

## Goal

Define TypeScript interfaces for production orders and phase executions, plus request/response DTOs with class-validator rules for MES-05 HTTP routes only.

**Depends on:** Task 00.  
**Blocks:** Tasks 02–06.

---

## Scope

- Extend `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` with order/execution types and repository/service method signatures.
- Create DTOs under `apps/api/src/mes/plant/controller/dto/` for ticket routes.

---

## Out of Scope

- Repository, service, controller implementation.
- Complete-phase DTO (no HTTP route in MES-05).
- WebSocket gateway types.
- Schema changes.
- Tests (task 09).

---

## Files allowed

- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend
- `apps/api/src/mes/plant/controller/dto/create-order.dto.ts` — create
- `apps/api/src/mes/plant/controller/dto/list-orders-query.dto.ts` — create
- `apps/api/src/mes/plant/controller/dto/order-detail.response.ts` — create
- `apps/api/src/mes/plant/controller/dto/pause-order.dto.ts` — create
- `apps/api/src/mes/plant/controller/dto/cancel-order.dto.ts` — create
- `apps/api/src/mes/plant/controller/dto/qa-approve.dto.ts` — create (optional notes)

---

## Files forbidden

- `apps/api/src/mes/auth/**`
- `apps/api/src/mes/plant/repository/**`
- `apps/api/src/mes/plant/service/**`
- `apps/api/src/mes/plant/controller/plant.controller.ts`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Interface additions

Extend `IPlantRepository`:

- `createOrderWithExecutionsTx(input): Promise<OrderWithExecutions>`
- `findOrders(tenantId, filters): Promise<ProductionOrder[]>`
- `findOrderDetailById(tenantId, id): Promise<OrderDetail | null>`
- `updateOrder(...)`, `updateExecution(...)`
- `findExecutionById(tenantId, id): Promise<PhaseExecution | null>`

Extend `IPlantService` with order lifecycle methods.

Add `IPhaseChainService` (or methods on plant service interface):

- `completeExecution(tenantId, executionId, input): Promise<ChainResult>` — **internal only**

### Create order DTO

| Field                            | Validation                    |
| -------------------------------- | ----------------------------- |
| `recipeId`                       | required string               |
| `batchCount`                     | int ≥ 1                       |
| `shift`                          | `ProductionShift` enum        |
| `priority`                       | optional `ProductionPriority` |
| `plannedStartAt`, `plannedEndAt` | ISO dates; end after start    |
| `supervisorId`, `notes`          | optional                      |

### List orders query DTO

Optional: `status`, `shift`, `priority`, `plannedStartFrom`, `plannedStartTo`.

### Pause / cancel DTOs

- Pause: `reason` required (non-empty string).
- Cancel: `reason` required; `consumedInputsAction` enum per task 08.

### QA approve DTO

Optional `notes` string.

### Response DTOs

- List item: id, number, status, priority, shift, plannedStartAt.
- Detail: order + executions (with phase order, requiresQA, status) + open `OperatorSession[]`.

Decimals as strings in responses (MES-02 pattern).

---

## Acceptance criteria

- [ ] Interfaces compile; existing masters methods unchanged.
- [ ] DTOs cover all MES-05 HTTP routes (no complete-phase DTO).
- [ ] Cancel DTO documents `consumedInputsAction` enum.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
node scripts/validate-structure.js
```
