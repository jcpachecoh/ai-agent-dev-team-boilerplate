# PLT-05 BE-02 — Tests de incidentes: pausa, listado, mapeos

**Parent:** `../16-production-novelties.md`  
**Status:** `pending`  
**Depends on:** `01-schema-and-response.md`  
**Blocks:** `05-plant-incident-service.md`

---

## Goal

Cubrir con tests unitarios el comportamiento de novedades en `IncidentService` y rutas alias PLT-05: registro con/sin pausa automática, listado por orden, mapeos de tipo/gravedad, y resolve.

---

## Scope

- Ampliar `incident.service.spec.ts`:
  - Create con `noveltyType=UNPLANNED_STOP`, `requiresPause=true` → llama `tryAutoPauseOrder`.
  - Create con `severity=HIGH` (→ `CRITICAL`) sin `requiresPause` → pausa igualmente.
  - Create con `severity=LOW`, `requiresPause=false` → **no** pausa.
  - Persiste `noveltyType` y `requiresPause` en repository mock.
  - Append `NOVELTY_ADDED` en production log cuando hay `orderId`.
  - Emite `incident:created` vía `PlantEventsService`.
- Ampliar `plant.controller.spec.ts`:
  - `POST orders/:id/incidents` delega a `createIncident` con `orderId` del path.
  - `GET orders/:id/incidents` filtra por `orderId` y query `resolved`.
- Tests de `mapNoveltyType` / `mapNoveltySeverity` en DTO (si no hay spec dedicado, casos en service spec).

---

## Out of Scope

- Tests E2E HTTP con Supertest (opcional follow-up).
- Tests de alarm cron / BullMQ.
- Tests frontend plant o UI.
- Cambios de schema (task 01).

---

## Files allowed

- `apps/api/src/mes/plant/test/incident.service.spec.ts`
- `apps/api/src/mes/plant/test/plant.controller.spec.ts`
- `apps/api/src/mes/plant/controller/dto/create-novelty.dto.ts` (solo si se extraen tests de mappers a archivo `.spec` colindante)

---

## Files forbidden

- `apps/api/prisma/**`
- `package.json`, `pnpm-lock.yaml`
- `apps/plant/**`, `packages/**`

---

## Implementation notes

### Patrón AAA

Usar comentarios `// Arrange`, `// Act`, `// Assert` en cada test.

### Mocks

- `IncidentRepository` — mock `createIncident`, `findIncidents`, `resolveIncident`.
- `PlantRepository` — mock `findOrderById` para validación de referencias.
- `PlantService` — mock método de pausa usado por `tryAutoPauseOrder`.
- `PlantEventsService` — spy `emitIncidentCreated`.
- `ProductionLogRepository` — spy `append`.

### Casos edge

- `orderId` inexistente → `NotFoundException`.
- Resolve incidente ya resuelto → `ConflictException`.
- `stepId` en DTO → se pasa como `executionId` al service.

---

## Acceptance criteria

- [ ] Cobertura de pausa automática: HIGH y `requiresPause=true` (sí); LOW sin pause (no).
- [ ] Listado por `orderId` con filtro `resolved=false`.
- [ ] Controller alias PLT-05 cubierto en spec.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern='incident'` en verde.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='incident'
```
