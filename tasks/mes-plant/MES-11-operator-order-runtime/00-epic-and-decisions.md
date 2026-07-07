# MES-11 Task 00 — Epic & Locked Decisions

## Goal

Decisiones bloqueadas para runtime operario (ProductionScreen backend).

**References:** `../MES-11-operator-order-runtime.md`

---

## Scope

- Decision log + checklist.
- Reconciliación con MES-05 (`pause` supervisor vs operario).

---

## Out of Scope

- Código.

---

## Files allowed

- `tasks/mes-plant/MES-11-operator-order-runtime/00-epic-and-decisions.md`

---

## Files forbidden

- `apps/api/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Locked decisions

| #   | Decision                     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Módulo                       | Extender `apps/api/src/mes/plant/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| D2  | Prefijo HTTP                 | **`/api/plant/orders/:id/...`** (no `/api/v1/production-orders` en Nest)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| D3  | `stepId` en API              | **`phaseExecutionId`** (UUID de `PhaseExecution`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| D4  | RBAC runtime                 | Mutaciones operario: `OPERATOR+`; `GET recipe` cualquier MES autenticado en la sede                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D5  | Pause operario vs supervisor | **Rutas distintas**: supervisor `POST .../pause` (MES-05, `reason` obligatorio); operario `POST .../pause` sin rol supervisor — misma URL **no** reutilizable; usar rutas nuevas bajo mismo path con guard `OPERATOR` o sub-rutas `.../operator/pause` si hay conflicto — **implementación elegida: reemplazar guard en pause/resume operario solo cuando `MesJwtPayload.role === OPERATOR` y body sin `reason` supervisor** → **preferido: rutas explícitas `POST orders/:id/operator/pause`** para no romper MES-05 |
| D6  | Rutas pause/resume operario  | `POST /api/plant/orders/:id/operator/pause` y `.../operator/resume` (evita colisión con supervisor)                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D7  | `start`                      | Solo desde `PLANNED`; primera fase `READY` o actual `READY` → `IN_PROCESS`; OP → `IN_PROCESS`; set `PhaseExecution.startedAt`                                                                                                                                                                                                                                                                                                                                                                                         |
| D8  | `complete-step`              | Delegar a `PhaseChainService.completeExecution()`; validar `stepId` pertenece a OP y está `IN_PROCESS`                                                                                                                                                                                                                                                                                                                                                                                                                |
| D9  | `finish`                     | Solo si todas las ejecuciones `COMPLETED` o última completada en la misma request; OP → `COMPLETED`, `actualEndAt`                                                                                                                                                                                                                                                                                                                                                                                                    |
| D10 | Timer server-side            | **No** persistir cronómetro en DB; cliente calcula UI. Servidor expone `startedAt`, logs y `paused` vía status. Opcional: `GET orders/:id/runtime` con `elapsedSeconds` derivado de logs (task 05)                                                                                                                                                                                                                                                                                                                    |
| D11 | `production_logs`            | Tabla append-only; no updates                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| D12 | `NOVELTY_ADDED`              | Escribir log desde `IncidentService.createIncident` cuando `orderId` presente (hook en task 04)                                                                                                                                                                                                                                                                                                                                                                                                                       |
| D13 | Stock check                  | `SupplyItem.stockDisponible` vs cantidad requerida escalada; `null` stock → sin warning                                                                                                                                                                                                                                                                                                                                                                                                                               |
| D14 | Receta congelada             | Usar `recipeId` + `recipeVersion` de la OP; fases/inputs de esa versión (snapshot en OP si existe en futuro; hoy leer receta actual con warning en doc)                                                                                                                                                                                                                                                                                                                                                               |
| D15 | Idempotencia offline         | Aceptar header opcional `Idempotency-Key` en POST mutaciones (task 04); si clave duplicada, devolver misma respuesta                                                                                                                                                                                                                                                                                                                                                                                                  |

### Corrección de rutas vs spec producto

| Spec producto     | Implementación MES-11                     |
| ----------------- | ----------------------------------------- |
| `POST .../pause`  | `POST .../operator/pause`                 |
| `POST .../resume` | `POST .../operator/resume`                |
| Resto             | Igual sustituyendo prefijo `plant/orders` |

Documentar en Postman y task 09 para el equipo mobile.

---

## Epic checklist

- [ ] Schema `ProductionLog` + migración
- [ ] Repository + service runtime
- [ ] GET recipe con stock
- [ ] 6 rutas HTTP (+ operator pause/resume)
- [ ] Logs en cada evento
- [ ] Tests flujo completo
- [ ] Postman MES-11
- [ ] Integración UI (task 09)

---

## Validation

N/A (doc only).
