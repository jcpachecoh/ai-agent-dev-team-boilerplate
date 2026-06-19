# MES-11 Task 04 — Operator runtime service

## Goal

Lógica de negocio: `start`, `operator/pause`, `operator/resume`, `complete-step`, `finish` + escritura de logs.

**Depends on:** Tasks 02, 03.

---

## Scope

- `OperatorOrderRuntimeService` (o métodos en `PlantService` si se mantiene cohesión).
- Inyectar: `PlantRepository`, `ProductionLogRepository`, `PhaseChainService`, `PlantEventsService`.
- Validaciones de estado (409 Conflict, 400 Bad Request, 404).
- Vincular `employeeId` desde `req.user.sub` → `OperationalUser`.
- Hook en `IncidentService.createIncident` para log `NOVELTY_ADDED` (mínimo: llamada desde runtime o PR separado documentado).

---

## Out of Scope

- Controller.
- GET recipe (task 05).
- Tests exhaustivos (task 08).

---

## Files allowed

- `apps/api/src/mes/plant/service/operator-order-runtime.service.ts`
- `apps/api/src/mes/plant/interfaces/operator-runtime.interfaces.ts`
- `apps/api/src/mes/plant/plant.module.ts`
- `apps/api/src/mes/plant/service/incident.service.ts` — solo hook log si `orderId` (mínimo)

---

## Files forbidden

- `apps/api/prisma/**`
- `plant.controller.ts` (task 06)
- `PhaseChainService` refactor amplio

---

## Transiciones (D7–D9)

### `startOrder(tenantId, orderId, operatorUserId, workStationId)`

1. OP `PLANNED` (409 si no).
2. Resolver ejecución actual: primera con status `READY` (o `PENDING` si plan incompleto → 409).
3. Validar `workStationId` coincide con ejecución.
4. TX: OP → `IN_PROCESS`; ejecución → `IN_PROCESS`, `startedAt = now()`, `responsibleUserId`.
5. Log `ORDER_STARTED`.
6. Emit WS `phase:status_changed`.

### `pauseOrderByOperator(...)`

1. OP `IN_PROCESS`.
2. Pausar ejecuciones `IN_PROCESS` → `PAUSED`.
3. OP → `PAUSED`.
4. Log `ORDER_PAUSED` con `durationSeconds` desde último `ORDER_STARTED` o `ORDER_RESUMED`.

### `resumeOrderByOperator(...)`

1. OP `PAUSED`.
2. Reanudar ejecuciones `PAUSED` → `IN_PROCESS`.
3. OP → `IN_PROCESS`.
4. Log `ORDER_RESUMED`.

### `completeStep(...)`

1. Validar `stepId` ∈ OP.
2. Ejecución `IN_PROCESS`.
3. Llamar `phaseChainService.completeExecution(...)`.
4. Log `STEP_COMPLETED` con `durationSeconds` desde `startedAt` o último evento del paso.

### `finishOrder(...)`

1. Todas las ejecuciones `COMPLETED` (o completar última si policy lo permite).
2. OP → `COMPLETED`, `actualEndAt`.
3. Log `ORDER_COMPLETED`.

### Idempotencia (D15)

- Header `Idempotency-Key`: si existe fila con misma clave, retornar resultado cacheado (guardar response hash o re-fetch order state).

---

## Acceptance criteria

- [ ] Servicio implementa `IOperatorOrderRuntimeService`.
- [ ] Tenant safety en todas las queries.
- [ ] No rompe tests MES-05 existentes.
- [ ] Unit tests básicos en task 08.

---

## Validation commands

```bash
pnpm --filter api typecheck
pnpm --filter api test -- operator-order-runtime.service
```
