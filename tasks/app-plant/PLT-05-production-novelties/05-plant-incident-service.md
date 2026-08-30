# PLT-05 PLT-01 — Servicio de incidentes en `apps/plant`

**Parent:** `../16-production-novelties.md`  
**Status:** `pending`  
**Depends on:** `01-schema-and-response.md`, `03-incident-modal-redesign.md`  
**Blocks:** `06-active-order-integration.md`, `07-offline-and-tests.md`

---

## Goal

Alinear la capa de servicios de `apps/plant` con el contrato `CreateNoveltyDto` y las rutas scoped por orden, reemplazando el modelo legacy de 4 tipos `IncidentType`.

---

## Scope

- Refactor `incident.service.ts`:
  - Tipos exportados: `NoveltyType`, `NoveltySeverity`, `OrderNovelty`, `ReportOrderNoveltyInput`.
  - `reportOrderNovelty(orderId, input)` → `POST /api/plant/orders/:orderId/incidents` con body:
    ```typescript
    {
      workStationId, noveltyType, severity, description,
      requiresPause?, stepId?, locationId?
    }
    ```
  - `fetchOrderNovelties(orderId, opts?: { resolved?: boolean })` → `GET /api/plant/orders/:orderId/incidents`.
  - Mapper response API → `OrderNovelty` (incl. `noveltyType`, `requiresPause`, `resolvedAt`).
  - Mantener `reportIncident` legacy para cola offline **o** deprecar internamente redirigiendo a `reportOrderNovelty` cuando hay `orderId`.
- Actualizar `IncidentReportModal.tsx`:
  - Estado: `noveltyType`, `noveltySeverity`, `requiresPause`.
  - Usar props del modal UI v2 (task UI-01).
  - Submit llama `reportOrderNovelty` cuando `orderId` presente.
- Tests `incident.service.test.ts`:
  - POST correcto path y body.
  - GET parsea lista.
  - Error si descripción vacía.

---

## Out of Scope

- Cola offline extendida (task 07).
- Socket listeners (task 06).
- Cambios backend (tasks BE-01/02).

---

## Files allowed

- `apps/plant/src/services/incident.service.ts`
- `apps/plant/src/services/incident.service.test.ts`
- `apps/plant/src/screens/ActivePhaseScreen/components/IncidentReportModal.tsx`
- `apps/plant/src/screens/ActivePhaseScreen/components/IncidentReportModal.test.tsx` (ajustar mocks)

---

## Files forbidden

- `apps/api/**`
- `packages/ui/**` (salvo consumo; cambios UI en task UI-01)
- `package.json`, `pnpm-lock.yaml`

---

## Implementation notes

### Mapeo `stepId`

En submit, enviar `executionId` del paso activo como `stepId` en el body (nombre DTO BE).

### Auth

Reutilizar `plantFetch` con token MES existente — sin cambios de auth.

### Tipos legacy

Eliminar o marcar `@deprecated` exports `IncidentType` / `AlarmSeverity` si ya no se usan fuera del módulo.

---

## Acceptance criteria

- [ ] `reportOrderNovelty` usa ruta scoped por orden.
- [ ] `fetchOrderNovelties` devuelve array tipado.
- [ ] Modal plant usa tipos de 7 novedades y gravedad LOW/MEDIUM/HIGH.
- [ ] Tests unitarios del servicio en verde.

---

## Validation commands

```bash
pnpm --filter @restopsiq/plant typecheck
pnpm --filter @restopsiq/plant test -- incident.service
```
