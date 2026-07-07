# UI-KDS-06: Dashboard multi-estación — Plant Active Phase

**Domain:** `[UI-KDS]` `[PLANT]` `[TOUCH]` `[DASHBOARD]` `[WEBSOCKET]`  
**Assigned Agent:** frontend-developer, ui-engineer  
**Status:** `pending`  
**Created:** 2026-06-16  
**Depends On:** [00-epic.md](./00-epic.md), [02-kds-active-phase-screen.md](./02-kds-active-phase-screen.md), `tasks/app-plant/04-zustand-stores.md`, `tasks/app-plant/08-plant-socket-hook.md`

---

## Objetivo

Reemplazar la pantalla actual de **una sola estación** (`ActivePhaseScreen`) por el nuevo **dashboard operario multi-celda** de Figma: vista con **1, 2 o 4 paneles** de estación de trabajo, header de resumen global, FAB para cambiar modo de vista y modal para asignar órdenes de producción a cada celda vacía.

La pantalla sigue viviendo en `apps/plant/src/screens/ActivePhaseScreen/` pero su responsabilidad pasa de “fase activa de una estación” a “tablero de celdas configurables”.

---

## Figma — referencias

| Nodo     | URL                                                                                                        | Uso                                             |
| -------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `2:1274` | [Layout 1×2 vacío](https://www.figma.com/design/hSXRiWpTh3XudueTWIBOWL/Plant?node-id=2-1274&m=dev)         | Grid 2 columnas, slots vacíos                   |
| `2:1153` | [Layout 2×2 vacío](https://www.figma.com/design/hSXRiWpTh3XudueTWIBOWL/Plant?node-id=2-1153&m=dev)         | Grid 2×2, slots vacíos                          |
| `1:993`  | [Layout 1×1 con OP](https://www.figma.com/design/hSXRiWpTh3XudueTWIBOWL/Plant?node-id=1-993&m=dev)         | Panel único a ancho completo con tarjeta activa |
| `1:426`  | [Layout 2×2 con 4 OPs](https://www.figma.com/design/hSXRiWpTh3XudueTWIBOWL/Plant?node-id=1-426&m=dev)      | Cuatro tarjetas con estados distintos           |
| `1:428`  | [Tarjeta estación compacta](https://www.figma.com/design/hSXRiWpTh3XudueTWIBOWL/Plant?node-id=1-428&m=dev) | Componente celda en modo grid                   |
| `1:704`  | [Selector modo de vista](https://www.figma.com/design/hSXRiWpTh3XudueTWIBOWL/Plant?node-id=1-704&m=dev)    | FAB + menú `MODO DE VISTA`                      |
| `2:1462` | [Modal asignar OP](https://www.figma.com/design/hSXRiWpTh3XudueTWIBOWL/Plant?node-id=2-1462&m=dev)         | Modal “Asignar orden de producción”             |

**Archivo Figma:** `Plant` — file key `hSXRiWpTh3XudueTWIBOWL`

---

## Alcance

### 1. Header global (`PlantDashboardHeader`)

Barra superior compartida por todos los modos de vista (nodos `2:1274`, `2:1153`, `1:993`):

| Zona      | Contenido                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Izquierda | Marca `RESTOPSIQ` + `PLANT` + label `DASHBOARD`                                                                   |
| Centro    | Contadores agregados: **EN PROCESO** (teal), **PAUSADAS** (amarillo), **NOVEDADES** (rojo), **PENDIENTES** (azul) |
| Derecha   | Hora local, icono conectividad, nombre operador, reloj `HH:MM:SS`, botón `SALIR`                                  |

- Reutilizar `LogoutButton` de `@restopsiq/ui` donde aplique.
- Contadores derivados del estado de todas las celdas visibles (no hardcodear `1`).

### 2. Grid de celdas (`WorkstationGrid`)

Contenedor que renderiza **N celdas** según el modo de vista:

| Modo  | Label Figma         | Celdas | Layout CSS                 |
| ----- | ------------------- | ------ | -------------------------- |
| `1x1` | `1×1 — 1 pantalla`  | 1      | 1 columna, altura completa |
| `1x2` | `1×2 — 2 pantallas` | 2      | 2 columnas iguales         |
| `2x2` | `2×2 — 4 pantallas` | 4      | grid 2×2                   |

- Separadores: borde punteado `#2a2a2a` entre celdas (como Figma).
- Cada celda ocupa el espacio disponible (`flex` / `grid` + `min-height: 0` para scroll interno).

### 3. Celda vacía (`PlantWorkstationEmptySlot`)

Estado cuando la celda no tiene OP asignada (nodos `2:1274`, `2:1153`):

- Fondo `#0c0c0c`, borde dashed `#2a2a2a`.
- Icono `+` en círculo punteado.
- Texto: `SIN ORDEN ASIGNADA` + `TOCA PARA ASIGNAR`.
- `onClick` → abre `OrderAssignModal` para esa celda.

### 4. Celda con OP (`PlantWorkstationCard`)

Tarjeta de estación según Figma `1:428` / `1:426`. Dos densidades:

| Densidad  | Cuándo              | Ajustes                                                     |
| --------- | ------------------- | ----------------------------------------------------------- |
| `full`    | Modo `1x1`          | Tipografía grande, timer ~50px, botones altos               |
| `compact` | Modos `1x2` y `2x2` | Tipografía reducida, lista de insumos truncada con `+N más` |

**Estructura de la tarjeta:**

| Bloque         | Detalle                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Borde superior | Color según estado (amarillo pausado, verde en proceso, azul pendiente, rojo novedad)                            |
| Header fila    | Dot + `OP-XXXXXX`, botón `VER RECETA`, badge estado (`PAUSADO`, `EN PROCESO`, `PENDIENTE`, `NOVEDAD`, `URGENTE`) |
| Título         | Nombre producto (ej. `Chicharrón prensado`)                                                                      |
| Tabs           | `PROCESO` \| `NOVEDADES` (tab activa con subrayado gold)                                                         |
| Cuerpo proceso | Receta, fase actual, contador `2 / 3`, lista insumos/equipos con cantidades                                      |
| Timer          | `mm:ss` grande; estados secundarios: `⏸ PAUSADO`, `NO INICIADO`, referencia `ESTÁNDAR 15:00`                     |
| Operador       | Dot teal + nombre                                                                                                |
| Acciones       | Según estado (ver tabla abajo)                                                                                   |
| Esquina        | Botón `CAMBIAR` → reabre modal de asignación para esa celda                                                      |

**Acciones por estado:**

| Estado        | Botones visibles                                                     |
| ------------- | -------------------------------------------------------------------- |
| `pending`     | `INICIAR` (teal, ancho completo)                                     |
| `in_progress` | `PAUSAR` (amarillo) + `FINALIZAR` (deshabilitado/gris) + `⚠` novedad |
| `paused`      | `REANUDAR` (azul) + `FINALIZAR` (gris) + `⚠` novedad                 |
| `incident`    | Similar a pausado; badge `NOVEDAD` en header                         |

- Acciones destructivas / irreversibles: mantener patrón `DoubleTapActionButton` existente en Plant.
- Timer por celda: instancia independiente de `timer.store` o sub-store indexado por `cellId` (ver Estado).

### 5. FAB modo de vista (`PlantLayoutModeFab`)

Nodo `1:704`:

- Botón circular fijo abajo-derecha (≈ 47×47 px).
- Al tocar: despliega menú `MODO DE VISTA` con 3 opciones:
  - `1×1 — 1 pantalla` (icono expand)
  - `1×2 — 2 pantallas` (icono 2 columnas)
  - `2×2 — 4 pantallas` (icono grid 2×2)
- Opción activa: fondo/borde gold `#c8a96e`.
- Persistir preferencia en `localStorage` / Capacitor Preferences.
- Al reducir celdas (ej. 4→2): conservar datos de celdas 1–2; celdas 3–4 quedan en store pero no visibles (no borrar asignaciones).

### 6. Modal asignar OP (`OrderAssignModal`)

Nodo `2:1462`:

| Elemento  | Detalle                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Header    | `CELDA N` + título `Asignar orden de producción` + botón cerrar                                                   |
| Lista     | Filas clicables con OP disponibles                                                                                |
| Fila      | Dot estado, `OP-XXXXXX`, tag `URGENTE` opcional, nombre producto, meta `Receta · Paso X/Y · EST-XX`, badge estado |
| Selección | Tap en fila → asigna OP a la celda y cierra modal                                                                 |
| Vacío     | Mensaje “No hay órdenes disponibles”                                                                              |

Colores de estado en filas (alinear a Figma):

| Estado        | Color acento |
| ------------- | ------------ |
| `in_progress` | `#2ec4a0`    |
| `pending`     | `#3b82f6`    |
| `paused`      | `#f0c040`    |
| `incident`    | `#e05a44`    |

---

## Ubicación de archivos

### `packages/ui` — componentes Storybook

Namespace sugerido: **Field Ops/Plant Dashboard/**

```txt
packages/ui/src/components/field-ops/plant-dashboard/
 ├── plant-dashboard-header/
 ├── plant-status-counters/
 ├── plant-workstation-card/
 ├── plant-workstation-empty-slot/
 ├── plant-layout-mode-fab/
 ├── plant-order-assign-modal/
 └── shared/plant-workstation-types.ts
```

Cada carpeta sigue el patrón estándar (`*.tsx`, `*.module.scss`, `*.stories.tsx`, `index.ts`).

### `apps/plant` — pantalla y orquestación

```txt
apps/plant/src/screens/ActivePhaseScreen/
 ├── ActivePhaseScreen.tsx              # shell: header + grid + FAB + modals
 ├── ActivePhaseScreen.module.scss
 ├── ActivePhaseScreen.test.tsx
 ├── components/
 │   ├── WorkstationGrid.tsx
 │   ├── WorkstationCell.tsx            # empty | card según datos
 │   └── OrderAssignModalHost.tsx       # conecta modal a store/API
 └── index.ts

apps/plant/src/stores/
 └── dashboard-layout.store.ts          # layoutMode, cells[], acciones asignar/cambiar
```

---

## Estado (Zustand)

Nuevo store `dashboard-layout.store.ts`:

```ts
export type LayoutMode = '1x1' | '1x2' | '2x2';

export type WorkstationCellStatus = 'empty' | 'pending' | 'in_progress' | 'paused' | 'incident';

export interface WorkstationCell {
  cellIndex: number; // 0..3
  stationId?: string; // EST-02, etc.
  orderId?: string;
  status: WorkstationCellStatus;
  snapshot?: WorkstationSnapshot; // datos para PlantWorkstationCard
}

export interface DashboardLayoutState {
  layoutMode: LayoutMode;
  cells: WorkstationCell[];
  setLayoutMode: (mode: LayoutMode) => void;
  assignOrderToCell: (cellIndex: number, orderId: string) => void;
  clearCell: (cellIndex: number) => void;
  hydrateFromPreferences: () => Promise<void>;
}
```

- `usePhaseStore` actual puede alimentar **demo** de una celda o migrarse gradualmente; no eliminar sin migrar tests.
- Timers: `Record<cellIndex, TimerSlice>` o store dedicado `workstation-timer.store.ts` — **un timer por celda**, tick local 1 s.

---

## WebSocket

- Suscribir `usePlantSocket` a eventos de fase/OP.
- Actualizar la celda correspondiente por `stationId` u `orderId` **sin reload**.
- Recalcular contadores del header al cambiar cualquier celda.

---

## Integración existente

| Pieza actual                                    | Destino                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ActivePhaseScreen.tsx` (layout 2 columnas KDS) | Reemplazado por dashboard; lógica útil (socket, timer) migra a `WorkstationCell`    |
| `PhaseTimerBlock`                               | Reutilizar dentro de `PlantWorkstationCard` o adaptar props                         |
| `DoubleTapActionButton`                         | Mantener en acciones de tarjeta                                                     |
| `OperatorChipsFooter`                           | Fuera de alcance en vista compacta; opcional en `1x1` si cabe en diseño             |
| `App.tsx`                                       | Sin cambio de ruta; mismos callbacks `onCompletePhase`, `onReportIssue`, `onLogout` |

---

## SCSS / tokens

- `theme="dark"` en todos los componentes UI.
- Tokens Plant: `apps/plant/src/styles/_tokens.scss` + variables SCSS del design system.
- IBM Plex Mono para labels técnicos; IBM Plex Sans para títulos (como Figma).
- No instalar Tailwind.

---

## Testing

| Caso                                              | Tipo                          |
| ------------------------------------------------- | ----------------------------- |
| Grid renderiza 1, 2 y 4 celdas según `layoutMode` | Unit — `WorkstationGrid`      |
| Cambiar modo persiste en Preferences              | Unit — store                  |
| Celda vacía abre modal con índice correcto        | Unit                          |
| Asignar OP rellena celda y cierra modal           | Unit                          |
| Reducir de 4→2 celdas no pierde asignaciones      | Unit — store                  |
| Contadores header suman estados de celdas         | Unit                          |
| Timer independiente por celda en progreso         | Unit                          |
| FAB muestra opción activa resaltada               | Unit — `PlantLayoutModeFab`   |
| Snapshot compact vs full en tarjeta               | Unit — `PlantWorkstationCard` |
| Socket mock actualiza celda por `orderId`         | Unit — `ActivePhaseScreen`    |

---

## Criterios de aceptación

- [ ] `ActivePhaseScreen` muestra dashboard multi-celda según Figma (no el layout KDS anterior de 2 columnas).
- [ ] Modos `1×1`, `1×2` y `2×2` funcionales vía FAB `MODO DE VISTA`.
- [ ] Celdas vacías muestran placeholder y abren modal de asignación.
- [ ] Modal lista OPs con estados/colores de Figma `2:1462`.
- [ ] Tarjeta de estación replica estados: pendiente, en proceso, pausado, novedad (nodos `1:428`, `1:426`).
- [ ] Header con contadores agregados y botón salir operativo.
- [ ] Preferencia de layout persiste entre sesiones.
- [ ] Componentes visuales publicados en Storybook **Field Ops/Plant Dashboard/**.
- [ ] Tests unitarios críticos pasan.
- [ ] Validación visual contra nodos Figma listados arriba.

---

## Fuera de alcance

- API backend real para listar/asignar OPs (usar mock/demo store en esta tarea).
- Pantalla supervisor `tasks/app-plant/12-supervisor-screens.md`.
- `ProduccionPlantStationCard` del módulo web-app producción (componente distinto).
- Flujo completo `CompletePhaseScreen` / teclado numérico (tarea UI-KDS-03).
- Tab `NOVEDADES` con listado detallado (solo switch de tab; contenido puede ser placeholder).
- Modal `VER RECETA` (botón presente; acción puede ser `noop` o toast “próximamente”).

---

## Archivos permitidos

```txt
apps/plant/src/screens/ActivePhaseScreen/**
apps/plant/src/stores/dashboard-layout.store.ts
apps/plant/src/stores/workstation-timer.store.ts   # si se separa del timer global
packages/ui/src/components/field-ops/plant-dashboard/**
packages/ui/src/components/field-ops/index.ts        # exports
packages/ui/src/index.ts                             # exports públicos
```

---

## Archivos prohibidos

```txt
package.json
pnpm-lock.yaml
schema.prisma
apps/api/**
apps/web-app/**
apps/plant/src/app.module.ts
scripts/validate-structure.js
```

---

## Comandos de validación

```bash
pnpm --filter @restopsiq/ui storybook
pnpm turbo dev --filter=@restopsiq/plant
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo test --filter=@restopsiq/ui
pnpm typecheck
```

---

## Orden de implementación sugerido

1. Tipos + stories de `PlantWorkstationCard` y `PlantWorkstationEmptySlot` en `packages/ui`.
2. `PlantDashboardHeader`, `PlantLayoutModeFab`, `OrderAssignModal` en `packages/ui`.
3. `dashboard-layout.store.ts` con demo data (4 OPs de Figma).
4. Refactor `ActivePhaseScreen` → shell + `WorkstationGrid`.
5. Cablear modal, FAB, socket y timers por celda.
6. Tests y validación visual Storybook.
