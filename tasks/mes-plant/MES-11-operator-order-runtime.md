# MES-11 — Operator Order Runtime API (ProductionScreen backend)

**Ticket:** MES-11  
**Branch sugerida:** `feature/mes-11-operator-order-runtime`  
**Status:** Planned  
**Priority:** High  
**UI existente:** `packages/ui` → `PlantRecipeDetailScreen` (`plant-recipe-detail-screen/`)

---

## Goal

Exponer la API REST que respalda la **Vista de Ejecución de Orden** del operario en tablet: receta completa paso a paso, control de ejecución (iniciar, pausar, reanudar, siguiente paso, finalizar), contador de tiempo, insumos por paso con alerta de stock, y auditoría en `production_logs`.

La interfaz ya está en `@restopsiq/ui`. **Este epic es solo backend + cableado mínimo de integración** (task 09).

---

## Historia de usuario

Como operario en la tablet, quiero ver la receta completa de una orden de producción paso a paso y controlar su ejecución con botones de Iniciar, Pausar, Reanudar y Finalizar, con un contador visual siempre visible.

---

## Estado actual (baseline)

| Capacidad                                                            | Estado                                            |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| `PATCH /api/plant/orders/:id/plan` (DRAFT → PLANNED)                 | ✅ MES-05                                         |
| `POST /api/plant/orders/:id/pause` / `resume` (supervisor)           | ✅ MES-05 — requiere `SUPERVISOR+` y `reason`     |
| `PhaseChainService.completeExecution()`                              | ✅ interno — sin HTTP                             |
| `POST /api/plant/executions/:id/qa-approve`                          | ✅ supervisor                                     |
| `GET /api/plant/recipes/:id`                                         | ✅ receta maestra — no enlazada a OP en ejecución |
| `POST .../start`, `complete-step`, `finish`, `GET .../recipe` por OP | ❌                                                |
| Tabla `production_logs`                                              | ❌                                                |
| Stock insuficiente en payload de receta de OP                        | ❌                                                |

**Nota de rutas:** El spec de producto usa `/api/v1/production-orders/...`. En este monorepo la convención MES es **`/api/plant/orders/...`** (ver decisión D2 en task 00). Postman y `apps/plant` deben usar el prefijo `plant`; un alias `v1/production-orders` queda fuera de scope salvo requerimiento explícito de gateway.

---

## Scope

- Prisma: modelo `ProductionLog` + enum `ProductionLogEvent`.
- Servicio `OperatorOrderRuntimeService` (o extensión acotada de `PlantService`) con reglas de transición operario.
- HTTP operator routes en `PlantController` (o sub-controller `operator-orders` bajo `plant`).
- `GET /api/plant/orders/:id/recipe` — receta congelada de la OP + fases + insumos (`PhaseInput` × `batchCount`) + stock disponible + proveedor principal.
- Persistencia de eventos en `production_logs` en cada mutación.
- Reutilizar `PhaseChainService` para avance de cadena al completar paso (cuando aplique QA).
- WebSocket: reutilizar `phase:status_changed` (+ opcional `order:runtime_changed`).
- Tests unitarios: flujo inicio → pausa → reanuda → siguiente paso → finaliza.
- Postman folder MES-11.

**Prerrequisitos:**

- MES-05 (`ProductionOrder`, `PhaseExecution`, `PhaseChainService`).
- MES-02 (`ProductionRecipe`, `ProductionPhase`, `PhaseInput`).
- MES Auth (`MesJwtGuard`, `OperationalRole.OPERATOR`).
- `OperatorSession` (opcional en task 04 — vincular operario a ejecución activa).

---

## Out of Scope

- Cambios de layout en `PlantRecipeDetailScreen` (ya hecho en UI).
- Cola offline IndexedDB (`apps/plant` task 09) — el cliente encola; el API debe ser **idempotente** donde sea posible (task 04).
- Movimientos de inventario / consumo real de insumos al completar paso.
- Alias HTTP `/api/v1/production-orders` (gateway futuro).
- `lint:fix` o formateo masivo.
- Nuevos permisos GraphQL back-office.

---

## Route contracts (canónicas)

Auth: `Authorization: Bearer <MES access token>`. Tenant desde JWT (`req.user.tenantId`).  
RBAC operario: `OPERATOR` (y superiores donde tenga sentido).

| Method | Path                                  | Body                                                    | Descripción                                                                                        |
| ------ | ------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/api/plant/orders/:id/recipe`        | —                                                       | Receta de la OP: pasos, insumos escalados, estado por paso, stock warning, proveedor               |
| POST   | `/api/plant/orders/:id/start`         | `{ workStationId }`                                     | OP `PLANNED`→`IN_PROCESS`; fase actual `READY`→`IN_PROCESS`; `startedAt`; log `ORDER_STARTED`      |
| POST   | `/api/plant/orders/:id/pause`         | `{ notes? }`                                            | Operario pausa OP + ejecuciones `IN_PROCESS`; log `ORDER_PAUSED`                                   |
| POST   | `/api/plant/orders/:id/resume`        | —                                                       | Operario reanuda; log `ORDER_RESUMED`                                                              |
| POST   | `/api/plant/orders/:id/complete-step` | `{ stepId, actualMinutes?, producedQuantity?, notes? }` | `stepId` = `phaseExecutionId`; completa paso; log `STEP_COMPLETED`; cadena vía `PhaseChainService` |
| POST   | `/api/plant/orders/:id/finish`        | `{ notes? }`                                            | Valida último paso; OP → `COMPLETED`; log `ORDER_COMPLETED`                                        |

`NOVELTY_ADDED` se registra vía `POST /api/plant/incidents` existente (MES-08) + hook que también escribe `production_logs` (task 04).

---

## Modelo `production_logs`

```typescript
type ProductionLogEvent =
  | 'ORDER_STARTED'
  | 'ORDER_PAUSED'
  | 'ORDER_RESUMED'
  | 'STEP_COMPLETED'
  | 'ORDER_COMPLETED'
  | 'NOVELTY_ADDED';

interface ProductionLog {
  orderId: string;
  stepId?: string; // phaseExecutionId
  employeeId: string; // operationalUserId del JWT
  locationId: string; // workStationId
  event: ProductionLogEvent;
  timestamp: Date;
  notes?: string;
  duration?: number; // segundos desde evento anterior del mismo scope
}
```

---

## Criterios de aceptación (epic)

- [ ] `GET /api/plant/orders/:id/recipe` devuelve estructura compatible con `PlantRecipeDetail` / `PlantRecipePhase` de `@restopsiq/ui`.
- [ ] Pasos reflejan estado real: `completed` / `current` / `pending` según `PhaseExecution.status`.
- [ ] Insumos por paso con cantidad escalada (`quantityPerBatch × batchCount`) y unidad.
- [ ] `stockWarning: true` cuando `stockDisponible < requiredQuantity` (consulta en tiempo real a `SupplyItem`).
- [ ] Proveedor principal visible por insumo (`tooltip` en UI).
- [ ] `start` / `pause` / `resume` / `complete-step` / `finish` con transiciones válidas y errores 409/400 claros.
- [ ] Cada mutación crea fila en `production_logs` con `employeeId` y `locationId`.
- [ ] `duration` en log calculado respecto al evento anterior de la misma OP (o paso).
- [ ] WebSocket emite cambios de fase tras `complete-step` (reuso `phase:status_changed`).
- [ ] Tests: flujo completo inicio→pausa→reanuda→siguiente paso→finaliza (service + controller).
- [ ] `node scripts/validate-structure.js` + `pnpm --filter=api test:cov` pasan.

---

## Task breakdown

| #   | Task                                                                                           | Depends |
| --- | ---------------------------------------------------------------------------------------------- | ------- |
| 00  | [Epic & locked decisions](./MES-11-operator-order-runtime/00-epic-and-decisions.md)            | —       |
| 01  | [Schema: production_logs](./MES-11-operator-order-runtime/01-schema-production-logs.md)        | 00      |
| 02  | [Interfaces & DTOs](./MES-11-operator-order-runtime/02-interfaces-dtos.md)                     | 00      |
| 03  | [Repository: production logs](./MES-11-operator-order-runtime/03-repository-production-log.md) | 01, 02  |
| 04  | [Operator runtime service](./MES-11-operator-order-runtime/04-operator-runtime-service.md)     | 02, 03  |
| 05  | [Recipe view + stock](./MES-11-operator-order-runtime/05-recipe-view-stock.md)                 | 02, 04  |
| 06  | [Controller routes](./MES-11-operator-order-runtime/06-controller-routes.md)                   | 04, 05  |
| 07  | [WebSocket events](./MES-11-operator-order-runtime/07-websocket-events.md)                     | 04      |
| 08  | [Tests & validation](./MES-11-operator-order-runtime/08-tests-validation.md)                   | 06, 07  |
| 09  | [Frontend integration](./MES-11-operator-order-runtime/09-frontend-integration.md)             | 06      |

Implementar **una task a la vez** según SDD.

---

## Validation commands (epic)

```bash
pnpm --filter api exec prisma validate
pnpm --filter api exec prisma generate
node scripts/validate-structure.js
pnpm --filter api typecheck
pnpm --filter api test -- --testPathPattern="operator-runtime|plant"
pnpm --filter api run test:cov
```

---

## Referencias

- UI: `packages/ui/src/components/field-ops/plant-dashboard/plant-recipe-detail-screen/`
- Tipos UI: `packages/ui/.../shared/plant-workstation-types.ts`
- MES-05: `tasks/mes-plant/MES-05-orders-phase-chain.md`
- App plant offline: `tasks/app-plant/09-offline-sync-queue.md`
