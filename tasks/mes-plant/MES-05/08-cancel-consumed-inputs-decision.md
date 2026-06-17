# MES-05 Task 08 — Cancel Consumed Inputs Decision

## Status

**Locked** — policy approved for MES-05. HTTP implementation lives in task 03 (`PlantService.cancelOrder`); unit test coverage for cancel rules is task 09.

**Depends on:** Task 00.  
**Unblocks:** Task 03 cancel implementation (done on branch).

---

## Goal

Lock the API policy for cancelling in-progress production orders when inputs may already be consumed, without inventory ledger writes.

---

## Scope

- Document decision in this file.
- Define request contract and persistence for supervisor cancel flow.

---

## Out of Scope

- Stock/inventory module or schema for consumption records.
- Actual stock movements.
- HTTP implementation (task 03).
- Unit tests (task 09).

---

## Files allowed

- `tasks/mes-plant/MES-05/08-cancel-consumed-inputs-decision.md` (this file)
- `tasks/mes-plant/MES-05-orders-phase-chain.md` — cross-reference only if needed

---

## Files forbidden

- `apps/api/src/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Problem

Ticket: _"Cancelar una OP en IN_PROCESS pregunta al supervisor qué hacer con los insumos ya consumidos"_

Schema has `PhaseInput` (BOM) but no consumption transactions. MES-05 must record the supervisor's decision without pretending stock was adjusted.

---

## Decision (MES-05)

1. Backend **enforces** supervisor choice via cancel request body when the order may have consumed inputs (`IN_PROCESS` or `PAUSED`).
2. **No inventory side effects** — enum value is persisted for audit only; a future inventory epic reads `notes` and performs stock movements.
3. **No schema migration** — append structured JSON to existing `ProductionOrder.notes`.
4. **Executions are not mass-updated on cancel** — completed executions stay `COMPLETED`; non-completed executions keep their current status; further chain/QA operations on the order are rejected with `409`.

---

## Request contract

`POST /api/plant/orders/:id/cancel`

| Field                  | Required when                         | Validation                                           |
| ---------------------- | ------------------------------------- | ---------------------------------------------------- |
| `reason`               | Always                                | Non-empty string (`@IsNotEmpty`, trimmed in service) |
| `consumedInputsAction` | Order status `IN_PROCESS` or `PAUSED` | Enum below; optional for `DRAFT` / `PLANNED`         |

### Enum `ConsumedInputsAction`

| Value             | Meaning (supervisor intent)                                           |
| ----------------- | --------------------------------------------------------------------- |
| `SCRAP`           | Treat consumed inputs as waste                                        |
| `RETURN_TO_STOCK` | Intent to return unused/consumed material to stock (future inventory) |
| `HOLD_FOR_REVIEW` | Quarantine / pending disposition (future inventory)                   |

DTO: optional field with `@IsEnum`; service enforces requirement by order status.

---

## Persistence

Append (merge) JSON under key `cancel` in `ProductionOrder.notes`:

```json
{
  "cancel": {
    "reason": "Cliente canceló pedido",
    "consumedInputsAction": "SCRAP",
    "cancelledAt": "2026-05-27T12:34:56.789Z",
    "cancelledBy": "<operationalUserId from JWT sub>"
  }
}
```

Rules:

- If prior `notes` is plain text or invalid JSON, preserve it under `userNotes` before merging.
- `consumedInputsAction` omitted from JSON when not supplied (e.g. cancel from `DRAFT` / `PLANNED`).
- `cancelledBy` is the MES JWT `sub` (operational user id), not a client-supplied field.

---

## Execution state on cancel

| Entity                   | Behavior                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Order                    | Status → `CANCELLED`                                                                           |
| Completed executions     | Unchanged (`COMPLETED`)                                                                        |
| Non-completed executions | Unchanged (e.g. `IN_PROCESS`, `READY`, `QA_PENDING`, `PAUSED`, `PENDING`)                      |
| Chain / QA               | `PhaseChainService.completeExecution` and `qaApproveExecution` → `409` if order is `CANCELLED` |

No WebSocket emit on cancel in MES-05 (order-level cancel; executions not bulk-updated).

---

## Validation errors

| Case                                                   | HTTP | Message (representative)                                                |
| ------------------------------------------------------ | ---- | ----------------------------------------------------------------------- |
| Missing / blank `reason`                               | 400  | `reason is required`                                                    |
| `IN_PROCESS` / `PAUSED` without `consumedInputsAction` | 400  | `consumedInputsAction is required when cancelling an in-progress order` |
| Invalid enum                                           | 400  | `Invalid consumedInputsAction`                                          |
| Cancel `COMPLETED` order                               | 409  | `Cannot cancel a completed order`                                       |
| Cancel already `CANCELLED` order                       | 409  | `Order is already cancelled`                                            |
| Chain/QA on cancelled order                            | 409  | `Cannot complete phase on a cancelled order` / QA equivalent            |

---

## Implementation traceability (task 03)

| Concern                     | Location                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Enum                        | `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` → `ConsumedInputsAction`         |
| DTO                         | `apps/api/src/mes/plant/controller/dto/cancel-order.dto.ts`                              |
| Service rules + notes merge | `apps/api/src/mes/plant/service/plant.service.ts` → `cancelOrder`, `appendOrderMetadata` |
| Chain guard                 | `apps/api/src/mes/plant/service/phase-chain.service.ts`                                  |
| Route                       | `POST /api/plant/orders/:id/cancel` — SUPERVISOR+ RBAC                                   |

---

## Follow-up (out of MES-05)

Inventory epic implements stock adjustments from stored `consumedInputsAction` and optional consumption records linked to phase executions.

---

## Acceptance criteria

- [x] Policy unambiguous for task 03 implementer.
- [x] No schema migration required.
- [ ] Task 03 tests cover missing `consumedInputsAction` for `IN_PROCESS` — **deferred to task 09** (implementation present; tests not yet added).

---

## Validation commands

```bash
# Spec-only — verify implementation from task 03:
grep -r "consumedInputsAction" apps/api/src/mes/plant/
```

Expected hits: interfaces, DTO, `plant.service.ts` (`cancelOrder` validation + notes persistence).
