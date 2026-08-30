# MES-11 Task 07 — WebSocket events

## Goal

Asegurar que el dashboard supervisor y la tablet reciban actualizaciones tras acciones operario.

**Depends on:** Task 04.

---

## Scope

- Reutilizar `PlantEventsService.emitPhaseStatusChanges` desde runtime service.
- Verificar payload incluye `orderId`, `phaseId`, `stationId`, `status`.
- Opcional: nuevo evento `order:runtime_changed` `{ orderId, status, currentPhaseIndex }` si la UI lo necesita.

---

## Out of Scope

- Cambios en `apps/plant` socket hook.
- Gateway nuevo.

---

## Files allowed

- `apps/api/src/mes/plant/service/plant-events.service.ts` — extend si hace falta
- `apps/api/src/mes/plant/gateway/plant.gateway.ts` — extend si nuevo evento
- `apps/api/src/mes/plant/test/plant-events.service.spec.ts` — create/extend

---

## Files forbidden

- `apps/api/prisma/**`
- `package.json`

---

## Acceptance criteria

- [ ] `start` y `complete-step` emiten `phase:status_changed`.
- [ ] Test unitario verifica emit llamado con tenant correcto.
- [ ] Documentado en epic README si se agrega `order:runtime_changed`.

---

## Validation commands

```bash
pnpm --filter api test -- plant-events
```
