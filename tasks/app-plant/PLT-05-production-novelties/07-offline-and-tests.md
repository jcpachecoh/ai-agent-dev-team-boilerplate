# PLT-05 PLT-03 — Cola offline extendida + tests Vitest

**Parent:** `../16-production-novelties.md`  
**Status:** `pending`  
**Depends on:** `05-plant-incident-service.md`, `06-active-order-integration.md`

---

## Goal

Extender la cola offline para novedades con el payload PLT-05 (`noveltyType`, `requiresPause`, ruta por orden) y cerrar cobertura de tests del flujo modal → servicio → cola.

---

## Scope

- `offline-queue.service.ts`:
  - Tipo cola `incident.create` actualizado:
    ```typescript
    {
      orderId: string;           // requerido para replay scoped
      workStationId: string;
      noveltyType: NoveltyType;
      severity: NoveltySeverity;
      description: string;
      requiresPause?: boolean;
      stepId?: string;
      locationId?: string;
    }
    ```
  - Replay online: `POST /api/plant/orders/:orderId/incidents` (no `/api/plant/incidents` genérico cuando hay `orderId`).
  - Idempotency key estable: `incident:${orderId}:${clientGeneratedId}`.
- `incident.service.ts`:
  - Rama offline delega a cola con payload extendido.
  - Mensaje UX si encolado: toast o error info en modal (patrón existente).
- Tests:
  - `incident.service.test.ts`: offline enqueue con nuevo payload.
  - `offline-queue.service.test.ts` (si existe) o casos en incident spec: replay URL correcta.
  - `IncidentReportModal.test.tsx`: submit con `requiresPause` y tipo seleccionado (mock service).
- Documentar en `apps/plant/README.md` una línea sobre cola novedades PLT-05 (opcional, 1 párrafo).

---

## Out of Scope

- Upload foto en replay offline (fase 2 — mantener `imageBase64` sin cambiar si ya existe).
- Tests E2E device.
- Cambios backend.

---

## Files allowed

- `apps/plant/src/services/offline-queue.service.ts`
- `apps/plant/src/services/incident.service.ts`
- `apps/plant/src/services/incident.service.test.ts`
- `apps/plant/src/services/offline-queue.service.test.ts` (create si no existe)
- `apps/plant/src/screens/ActivePhaseScreen/components/IncidentReportModal.test.tsx`
- `apps/plant/README.md` (opcional, 1 párrafo)

---

## Files forbidden

- `apps/api/**`
- `packages/ui/**`
- `package.json`, `pnpm-lock.yaml`

---

## Implementation notes

### Replay order

Al sincronizar, procesar cola FIFO; si POST falla 4xx no reintentar infinito (patrón cola existente).

### Compatibilidad

Items viejos en cola sin `orderId`: fallback a `POST /api/plant/incidents` para no romper dispositivos en campo.

---

## Acceptance criteria

- [ ] Offline registra payload con `noveltyType` y `requiresPause`.
- [ ] Replay usa ruta scoped cuando `orderId` presente.
- [ ] Tests offline + modal actualizados en verde.
- [ ] `pnpm --filter @restopsiq/plant test` pasa subset incident/offline.

---

## Validation commands

```bash
pnpm --filter @restopsiq/plant typecheck
pnpm --filter @restopsiq/plant test -- incident
pnpm --filter @restopsiq/plant test -- offline-queue
```
