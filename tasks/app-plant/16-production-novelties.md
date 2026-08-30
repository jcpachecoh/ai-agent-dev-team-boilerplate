# PLT-05 — Novedades en planta (registro + visualización)

**Domain:** `[FRONTEND]` `[PLANT]` `[UI]` `[MES]` `[REST]`  
**Assigned Agent:** fullstack-developer  
**Status:** `pending`  
**Depends on:** `MES-08-alarms-incidents.md`, `MES-11-operator-order-runtime`, `ui-kds/06-plant-dashboard-multi-workstation.md`, `app-plant/08-plant-socket-hook.md`, `app-plant/09-offline-sync-queue.md`  
**Epic:** `app-plant/00-epic.md`  
**Historia de usuario:** Operario/supervisor en tablet registra novedades durante una OP activa para trazabilidad y acción del supervisor.

---

## Goal

Completar el flujo de **novedades de producción** en `apps/plant`: modal touch-friendly para crear, tab **NOVEDADES** con historial de la orden, estado visual rojo en el grid cuando hay novedad abierta, y sincronización con la API existente de incidentes.

---

## Contexto actual vs. objetivo

| Capa                   | Estado hoy                                                                                                                                                              | Gap                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Prisma**             | Modelo `ProductionIncident` (`production_incidents`)                                                                                                                    | No crear `ProductionNovelty` — reutilizar incidentes manuales (MES-08 D4)                       |
| **API**                | `POST/GET /api/plant/orders/:id/incidents`, `POST /api/plant/incidents`, `PATCH /api/plant/incidents/:id/resolve`, `GET /api/plant/locations/:id/incidents?status=OPEN` | Ajustar mapeo de tipos producto (`NoveltyType` × 7) y persistir `requiresPause` si aplica       |
| **BE lógica**          | `IncidentService.createIncident` pausa orden si `severity=CRITICAL` o `requiresPause=true`; emite `incident:created`; log `NOVELTY_ADDED`                               | Exponer `noveltyType` en response; operador puede listar novedades de su orden                  |
| **UI (`packages/ui`)** | `PlantIncidentReportModal` (selects nativos, 4 tipos legacy); `PlantWorkstationCard` tab NOVEDADES = placeholder                                                        | Rediseñar modal 80% pantalla, grid visual de tipos, gravedad con colores, toggle pausa          |
| **Plant app**          | `IncidentReportModal` → `POST /api/plant/incidents` con `IncidentType` legacy (4 valores)                                                                               | Usar DTO `CreateNoveltyDto` y ruta scoped `POST /api/plant/orders/:id/incidents`; listar en tab |
| **Grid estado**        | `PlantWorkstationStatus` incluye `incident`                                                                                                                             | Derivar `incident` cuando la orden tenga ≥1 novedad sin resolver                                |
| **Web supervisor**     | OS-381 (fuera de scope plant)                                                                                                                                           | Consumir `GET locations/:id/incidents?status=OPEN` + resolve — task separada                    |

**Pantalla referencia:** sub-pantalla de orden activa (Figma / captura `Pollo asado porcionado` — tabs PROCESO | NOVEDADES, botón ⚠ en footer).

---

## Decisiones de arquitectura (locked)

| #   | Decisión               | Elección                                                                                                                                                      |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Tabla de persistencia  | **`ProductionIncident`** — no duplicar con `ProductionNovelty`                                                                                                |
| D2  | Rutas HTTP             | Prefijo existente **`/api/plant/**`** (no `/api/v1/production-orders`)                                                                                        |
| D3  | `stepId` en ticket     | Mapear a **`executionId`** (`PhaseExecution.id`) en API                                                                                                       |
| D4  | `employeeId` en ticket | Mapear a **`operatorUserId`** (`OperationalUser.id` del JWT MES)                                                                                              |
| D5  | Tipos producto (7)     | Enum **`NoveltyType`** en DTO; persistir en columna nueva `noveltyType` **o** JSON en `description` hasta migración — preferir columna nullable en task BE-01 |
| D6  | Gravedad UI            | `LOW` / `MEDIUM` / `HIGH` en FE → mapear a `AlarmSeverity` `INFO` / `WARNING` / `CRITICAL` (ya implementado en `create-novelty.dto.ts`)                       |
| D7  | Pausa automática       | Si `requiresPause=true` **o** `severity=HIGH` → `ProductionOrder.status = PAUSED` (ya en `IncidentService`)                                                   |
| D8  | Foto adjunta           | **Fase 2** — Capacitor Camera ya integrado; no bloquear MVP de listado/registro                                                                               |
| D9  | Offline                | Mantener cola `incident.create` en `offline-queue.service` con payload extendido                                                                              |

---

## Flujo UX (operario)

```
[Tap ⚠ NOVEDAD — siempre visible en sub-pantalla OP activa]
       ↓
[Modal ~80% viewport — PlantIncidentReportModal v2]
  1. Tipo (grid touch, íconos):
     🚫 Faltante de insumo        → INGREDIENT_SHORTAGE
     🔧 Falla equipo / máquina    → EQUIPMENT_FAILURE
     📋 Desviación de receta      → RECIPE_DEVIATION
     ⏸  Paro no planificado       → UNPLANNED_STOP
     🏥 Incidente de seguridad    → SAFETY_INCIDENT
     📦 Calidad del producto      → QUALITY_ISSUE
     🔵 Otro                      → OTHER

  2. Descripción (textarea obligatorio)
  3. Gravedad: 🟡 Baja · 🟠 Media · 🔴 Alta
  4. Toggle «¿Requiere pausa de la orden?» Sí/No
  5. [REGISTRAR NOVEDAD]
       ↓
[POST /api/plant/orders/:orderId/incidents]
       ↓
[Si pausa → orden PAUSED; celda grid → status incident (rojo)]
[Tab NOVEDADES muestra ítem nuevo]
[WS incident:created → refrescar lista si conectado]
[Si severity=HIGH o requiresPause → notificación supervisor — stub OK en MVP]
```

---

## Scope

### Backend (ajustes mínimos — task BE-01)

- Agregar columna opcional `noveltyType NoveltyType?` en `ProductionIncident` **o** documentar persistencia en metadata hasta migración acordada.
- Agregar columna `requiresPause Boolean @default(false)` si no se persiste hoy.
- Incluir `noveltyType` y `requiresPause` en `IncidentResponse`.
- Ampliar `mapNoveltyType` para distinguir `INGREDIENT_SHORTAGE`, `UNPLANNED_STOP`, `RECIPE_DEVIATION` (hoy varios caen en `OTHER`).
- Tests service: registro con/sin pausa, listado por orden, resolve.

### UI (`packages/ui`)

- Rediseñar `PlantIncidentReportModal`:
  - Tamaño `xl` / custom ~80% altura.
  - Grid visual de 7 tipos (no `<select>`).
  - Selector gravedad con chips de color.
  - Toggle pausa.
  - CTA **REGISTRAR NOVEDAD**.
- Nuevo `PlantOrderNoveltiesList` (tab NOVEDADES): lista cronológica con tipo, gravedad, descripción, fecha, badge «Abierta» / «Resuelta».
- Integrar lista en `PlantWorkstationCard` (reemplazar placeholder).

### Plant app (`apps/plant`)

- Actualizar `incident.service.ts`:
  - Tipos `NoveltyType` / `NoveltySeverity` alineados con BE.
  - `reportOrderNovelty(orderId, input)` → `POST /api/plant/orders/:id/incidents`.
  - `fetchOrderNovelties(orderId)` → `GET /api/plant/orders/:id/incidents?resolved=false`.
- Actualizar `IncidentReportModal` / host: pasar `executionId` del paso actual, `requiresPause`, tipo noveldad.
- `ActivePhaseScreen` / dashboard layout:
  - Botón ⚠ siempre visible en footer de tarjeta activa.
  - Tab NOVEDADES con datos reales.
  - Tras submit exitoso → refrescar novedades + actualizar `dashboard-layout.store` a `incident` si hay abiertas.
- Escuchar `incident:created` vía `usePlantSocket` para refresh en tiempo real.
- Offline: extender payload de cola con `noveltyType`, `requiresPause`, `orderId` en path al replay.

### Fuera de scope

- Dashboard web supervisor (OS-381) — badge y resolve UI en `apps/web-app` (task futura).
- Push OneSignal real (adapter stub MES-08).
- Firma digital al resolver (fase 2).
- Cambios a `package.json`, `pnpm-lock.yaml`, `scripts/validate-structure.js`.
- App `apps/plant` ejecución de fases distinta a sub-pantalla OP activa ya existente.

---

## Modelo de datos (referencia — usar `ProductionIncident`)

```prisma
// NO crear ProductionNovelty — extender si hace falta:

model ProductionIncident {
  // ...campos existentes...
  noveltyType    NoveltyType?   // nuevo — task BE-01
  requiresPause  Boolean        @default(false)  // nuevo — task BE-01
}

enum NoveltyType {
  INGREDIENT_SHORTAGE
  EQUIPMENT_FAILURE
  RECIPE_DEVIATION
  UNPLANNED_STOP
  SAFETY_INCIDENT
  QUALITY_ISSUE
  OTHER
}
```

> `IncidentType` (`QUALITY`, `SAFETY`, `EQUIPMENT`, `OTHER`) se mantiene para compatibilidad alarmas/MES; `noveltyType` es la clasificación operativa de producto.

---

## Endpoints (contrato — ya implementados salvo nota)

| Método  | Ruta                                             | Rol         | Uso                                                |
| ------- | ------------------------------------------------ | ----------- | -------------------------------------------------- |
| `POST`  | `/api/plant/orders/:id/incidents`                | OPERATOR+   | Registrar novedad en OP activa                     |
| `GET`   | `/api/plant/orders/:id/incidents`                | OPERATOR+   | Historial de la orden (`?resolved=false` abiertas) |
| `POST`  | `/api/plant/incidents`                           | OPERATOR+   | Alias legacy (mantener para offline queue)         |
| `PATCH` | `/api/plant/incidents/:id/resolve`               | SUPERVISOR+ | Resolver desde web                                 |
| `GET`   | `/api/plant/locations/:id/incidents?status=OPEN` | SUPERVISOR+ | Bandeja por sede                                   |

**Body `CreateNoveltyDto` (existente):**

```typescript
{
  workStationId: string;
  noveltyType: NoveltyType;
  severity: NoveltySeverity; // LOW | MEDIUM | HIGH
  description: string;
  requiresPause?: boolean;
  stepId?: string;      // → executionId
  locationId?: string;
  photoUrl?: string;    // fase 2
}
```

---

## Acceptance criteria

### AC 1 — Modal de registro

- [ ] Botón ⚠ **NOVEDAD** visible en sub-pantalla de orden activa (todos los estados operables: en proceso, pausado).
- [ ] Modal ocupa ~80% de la pantalla tablet.
- [ ] Selector visual de tipo con 7 opciones e íconos grandes (touch-friendly).
- [ ] Textarea descripción obligatorio.
- [ ] Selector gravedad Baja / Media / Alta con colores 🟡 🟠 🔴.
- [ ] Toggle «Requiere pausa» funcional.

### AC 2 — Persistencia y efectos

- [ ] `POST` registra novedad ligada a `orderId` y `executionId` del paso en curso (si existe).
- [ ] Si `requiresPause=true` o gravedad Alta → orden pasa a `PAUSED`.
- [ ] Celda del grid cambia a estado `incident` (borde/header rojo) mientras haya novedad abierta.

### AC 3 — Tab NOVEDADES

- [ ] Tab **NOVEDADES** lista historial de la orden (más reciente primero).
- [ ] Empty state: «Sin novedades registradas».
- [ ] Cada ítem muestra tipo, gravedad, descripción truncada, fecha/hora, estado abierta/resuelta.

### AC 4 — Tiempo real y offline

- [ ] Al crear novedad online, tab se actualiza sin recargar pantalla.
- [ ] Evento `incident:created` actualiza grid/lista si el socket está conectado.
- [ ] Sin red: encolar y sincronizar al reconectar (patrón cola existente).

### AC 5 — Notificación supervisor (MVP)

- [ ] Si `severity=HIGH` o `requiresPause=true`, backend emite `incident:created` en room tenant (ya existe).
- [ ] Stub de push/documentación para integración OS-381 — no bloqueante.

### AC 6 — Tests

- [ ] BE: registro con pausa, sin pausa, listado por orden, resolve.
- [ ] FE plant: modal submit llama endpoint correcto; tab renderiza lista mock.
- [ ] UI: grid status `incident` cuando hay novedad abierta.

---

## Subtasks (orden de implementación)

| ID     | Archivo                                                                      | Título                                                        |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| BE-01  | `tasks/app-plant/PLT-05-production-novelties/01-schema-and-response.md`      | Migración `noveltyType` + `requiresPause`; response extendido |
| BE-02  | `tasks/app-plant/PLT-05-production-novelties/02-incident-service-tests.md`   | Tests pausa, listado, mapeos                                  |
| UI-01  | `tasks/app-plant/PLT-05-production-novelties/03-incident-modal-redesign.md`  | `PlantIncidentReportModal` v2 (grid tipos, gravedad, toggle)  |
| UI-02  | `tasks/app-plant/PLT-05-production-novelties/04-novelties-list-tab.md`       | `PlantOrderNoveltiesList` + wiring en `PlantWorkstationCard`  |
| PLT-01 | `tasks/app-plant/PLT-05-production-novelties/05-plant-incident-service.md`   | `incident.service` + tipos alineados con `CreateNoveltyDto`   |
| PLT-02 | `tasks/app-plant/PLT-05-production-novelties/06-active-order-integration.md` | Modal, tab, grid `incident`, socket refresh                   |
| PLT-03 | `tasks/app-plant/PLT-05-production-novelties/07-offline-and-tests.md`        | Cola offline extendida + tests Vitest                         |

---

## Files allowed

### `apps/api` (solo tasks BE-01, BE-02)

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**` (solo SQL de esta feature)
- `apps/api/src/mes/plant/controller/dto/create-novelty.dto.ts`
- `apps/api/src/mes/plant/controller/dto/incident-response.dto.ts` (o equivalente)
- `apps/api/src/mes/plant/service/incident.service.ts`
- `apps/api/src/mes/plant/repository/incident.repository.ts`
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts`
- `apps/api/src/mes/plant/test/incident.service.spec.ts`
- `apps/api/src/mes/plant/test/plant.controller.spec.ts`

### `packages/ui`

- `packages/ui/src/components/field-ops/plant-dashboard/plant-incident-report-modal/**`
- `packages/ui/src/components/field-ops/plant-dashboard/plant-order-novelties-list/**` (create)
- `packages/ui/src/components/field-ops/plant-dashboard/plant-workstation-card/**`
- `packages/ui/src/components/field-ops/plant-dashboard/shared/plant-workstation-types.ts`
- `packages/ui/src/index.tsx` (exports)

### `apps/plant`

- `apps/plant/src/services/incident.service.ts`
- `apps/plant/src/services/incident.service.test.ts`
- `apps/plant/src/services/offline-queue.service.ts`
- `apps/plant/src/screens/ActivePhaseScreen/**`
- `apps/plant/src/stores/dashboard-layout.store.ts`
- `apps/plant/src/hooks/usePlantSocket.ts` (o equivalente)

---

## Files forbidden

- `package.json`, `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/web-app/**` (supervisor dashboard — OS-381)
- Cambios no relacionados en `apps/plant` login/routing

---

## Validation commands

```bash
# Backend (después de BE-01)
cd apps/api && pnpm prisma validate && pnpm prisma format
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern='incident'

# UI
pnpm --filter @restopsiq/ui build

# Plant
pnpm --filter @restopsiq/plant typecheck
pnpm --filter @restopsiq/plant test -- incident
pnpm --filter @restopsiq/plant test -- ActivePhaseScreen
```

---

## Fase 2 (no bloqueante)

- Adjuntar foto desde cámara tablet (`@capacitor/camera`) con upload a storage.
- Firma digital del supervisor al resolver.
- Dashboard web: badge novedades pendientes por sede (OS-381).
- Push OneSignal producción.

---

## Referencias en código

- Incidentes API: `apps/api/src/mes/plant/controller/plant.controller.ts` (rutas `orders/:id/incidents`)
- DTO novedad: `apps/api/src/mes/plant/controller/dto/create-novelty.dto.ts`
- Service: `apps/api/src/mes/plant/service/incident.service.ts`
- Modal plant: `apps/plant/src/screens/ActivePhaseScreen/components/IncidentReportModal.tsx`
- Tarjeta OP: `packages/ui/.../plant-workstation-card/PlantWorkstationCard.tsx`
- Epic alarmas: `tasks/mes-plant/MES-08-alarms-incidents.md`
- Dashboard multi-estación: `tasks/ui-kds/06-plant-dashboard-multi-workstation.md`
