# PLT-05 PLT-02 — Integración OP activa: modal, tab, grid `incident`, socket

**Parent:** `../16-production-novelties.md`  
**Status:** `pending`  
**Depends on:** `04-novelties-list-tab.md`, `05-plant-incident-service.md`  
**Blocks:** `07-offline-and-tests.md`

---

## Goal

Conectar el flujo completo en la sub-pantalla de orden activa (`ActivePhaseScreen` / `PlantWorkstationCard`): botón ⚠ siempre visible, modal v2, tab NOVEDADES con datos, celda roja en grid cuando hay novedad abierta, y refresh por WebSocket.

---

## Scope

- `ActivePhaseScreen` / `IncidentReportModalHost`:
  - Pasar `orderId`, `executionId` del paso en curso, `orderLabel`, `workStationId`.
  - Tras submit exitoso: refetch novedades + callback `onNoveltyRegistered`.
- Cargar novedades al montar tarjeta con OP activa (`useQuery` o fetch en effect con `orderId`).
- Pasar `novelties` a `PlantWorkstationCard`.
- `dashboard-layout.store.ts`:
  - Derivar `status: 'incident'` para celda cuando `openNoveltiesCount > 0` para esa orden/estación.
  - No sobrescribir `paused` si la orden está pausada por operador — prioridad visual: `incident` > `paused` > `in_progress` (documentar en store).
- `usePlantSocket` (o hook existente):
  - Suscribir a `incident:created`.
  - Si `payload.orderId` coincide con OP visible → invalidar/refetch novedades y actualizar grid.
- Botón ⚠ en footer de tarjeta: visible en estados `in_progress`, `paused`, `incident` (no en `pending` vacío).
- Al registrar novedad con pausa: refetch estado de orden si el runtime expone status (o optimista `paused`).

---

## Out of Scope

- Cola offline (task 07).
- Supervisor web dashboard.
- Cambios en `packages/ui` salvo props ya definidas en UI-01/02.

---

## Files allowed

- `apps/plant/src/screens/ActivePhaseScreen/**`
- `apps/plant/src/stores/dashboard-layout.store.ts`
- `apps/plant/src/hooks/usePlantSocket.ts` (o `plant-socket.service.ts`)
- `apps/plant/src/screens/ActivePhaseScreen/ActivePhaseScreen.test.tsx`

---

## Files forbidden

- `apps/api/**`
- `apps/web-app/**`
- `package.json`, `pnpm-lock.yaml`

---

## Implementation notes

### Flujo datos

```
mount(orderId) → fetchOrderNovelties
incident:created → refetch si match orderId
submit modal → reportOrderNovelty → onSuccess → refetch + set grid incident
```

### Contador tab (opcional)

Si UI-02 soporta badge, pasar `openCount` desde plant screen.

### Recipe detail / otras vistas

No modificar `RecipeDetailHost` salvo que comparta la misma tarjeta OP.

---

## Acceptance criteria

- [ ] Tab NOVEDADES muestra novedades reales de la OP activa.
- [ ] Tras registrar, lista se actualiza sin reload manual (online).
- [ ] Grid celda pasa a rojo (`incident`) con novedad abierta.
- [ ] Botón ⚠ abre modal desde footer en OP en proceso/pausada.
- [ ] Socket `incident:created` refresca UI cuando aplica.
- [ ] `ActivePhaseScreen.test.tsx` cubre contador `incidents` en layout store.

---

## Validation commands

```bash
pnpm --filter @restopsiq/plant typecheck
pnpm --filter @restopsiq/plant test -- ActivePhaseScreen
```
