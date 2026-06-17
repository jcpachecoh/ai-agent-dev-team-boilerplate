# Task: Producción / Plant Masters UI Components (Figma) — `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[FIGMA]` `[PRODUCCION]` `[MES]` `[PLANT-MASTERS]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `done`  
**Created:** 2026-06-09  
**Completed:** 2026-06-09  
**Depends On:** `05-field-ops-figma-components.md`, `06-receta-figma-components.md`, `07-inventario-figma-components.md`, `08-proveedor-figma-components.md`  
**Feeds:** `tasks/web-app/04-produccion-plant-masters-ui.md`

---

## Context

Implement the shared UI component set for **Configuración de Maestros de Planta** from the Opssynk Figma designs into:

```txt
packages/ui/src/components/produccion/
```

These components will support the supervisor web UI for:

- Mapa / operational plant overview
- Estaciones de producción
- Recetas de producción
- Detail side panels for selected stations and recipes

The web-app task consumes these components in `apps/web-app/src/features/produccion/`. This package task is only for reusable presentational components, Storybook previews, SCSS modules, exports and design-system documentation.

---

## Required Prerequisite Reading

Before implementation, read and follow the patterns from all prior `tasks/packages-ui` work:

- `01-feedbacks.md` — loading, empty and error states
- `02-Formularios.md` — form controls, input sizing and accessibility
- `03-Data-Display.md` — table/list semantics and data display patterns
- `05-field-ops-figma-components.md` — plant-floor dark UI and operator-style components
- `06-receta-figma-components.md` — component folder structure, `theme`/`size`, Storybook and SCSS conventions
- `07-inventario-figma-components.md` — page previews, shared theme files, Figma docs links
- `08-proveedor-figma-components.md` — dynamic tables, detail panels, action buttons and implementation order

Do not implement these screens as one-off Figma snapshots. Extract composable components that the web app can assemble with real data.

---

## Figma Source File

| Field     | Value                                                         |
| --------- | ------------------------------------------------------------- |
| File name | Opssynk                                                       |
| File key  | `owd5wBmVJgUE9n9MeOHxYb`                                      |
| Base URL  | `https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk` |

## Figma Screens

| Screen                        | Node ID     | URL                                                                                 | Notes                                                                |
| ----------------------------- | ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Mapa de planta / overview     | `2096:109`  | https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2096-109&m=dev  | Large node; inspect sublayers with `get_design_context` if needed    |
| Maestros — Estaciones         | `2096:1343` | https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2096-1343&m=dev | Includes station table and selected-station side panel               |
| Maestros — Recetas Producción | `2096:1828` | https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2096-1828&m=dev | Includes recipe table and selected-recipe side panel with phase list |

Figma is the visual source of truth for spacing, typography, color, density and selected states. Generated React/Tailwind from Figma is only reference material; convert to this repo's React + TypeScript + CSS Modules patterns.

---

## Design Reference Assets

Export screenshots from Figma and store them in:

```txt
tasks/packages-ui/design-references/produccion/
├── plant-overview.png
├── maestros-estaciones.png
└── maestros-recetas.png
```

Create `tasks/packages-ui/design-references/produccion/README.md` if the folder does not exist. Use screenshots only for validation, never as rendered UI.

---

## Global Requirements

### Theme

All components must support:

```ts
theme?: 'light' | 'dark';
```

Default Storybook args: `theme: 'dark'`, because these Figma screens use the dark plant-floor shell. Components should still expose light mode unless a component is explicitly only meaningful in the plant shell.

### Size

All reusable controls, rows, cards, panels and badges must support:

```ts
size?: 'sm' | 'md' | 'xl';
```

Use the existing package pattern:

```scss
.size--sm {
  --control-width: ...;
  --control-min-height: ...;
}

.size--md {
  --control-width: ...;
  --control-min-height: ...;
}

.size--xl {
  --control-width: 100%;
  --control-min-height: ...;
}
```

Width must use `width: min(100%, var(--control-width));` where applicable. Tables and composed previews must support `size="xl"` for full-width use in web-app screens.

### Styling

- Use CSS Modules and shared SCSS partials.
- Create `packages/ui/src/components/produccion/shared/_produccion-theme.scss`.
- Create `packages/ui/src/components/produccion/shared/produccion-types.ts`.
- No hardcoded colors in TSX.
- Figma colors such as gold `#c8a96e`, live teal `#2ec4a0`, danger `#e05a44`, warning `#f0c040` and dark surfaces may appear in SCSS only as documented tokens or semantic variables.
- Prefer `lucide-react` icons already used in the repo. Do not fetch remote Figma SVG assets into runtime components unless a logo/mark cannot be represented by existing icons.

### Storybook

Each component must include:

- `Component.stories.tsx`
- `tags: ['autodocs']`
- Controls for `theme` and `size`
- At least `Default`, `Selected` / `Active` when relevant, and `DarkMode`
- Figma dev-mode link in docs parameters or shared docs helper

Create composed preview stories:

- `Produccion/ProduccionPlantOverviewPreview`
- `Produccion/ProduccionStationsMasterPreview`
- `Produccion/ProduccionRecipesMasterPreview`

---

## Proposed Namespace

```txt
packages/ui/src/components/produccion/
├── shared/
│   ├── _produccion-theme.scss
│   ├── produccion-types.ts
│   ├── produccion-columns.ts
│   ├── produccion-story-docs.ts
│   └── story-decorators.tsx
├── produccion-plant-shell/
├── produccion-module-tabs/
├── produccion-sub-tabs/
├── produccion-kpi-cell/
├── produccion-filter-chip-group/
├── produccion-primary-action/
├── produccion-status-badge/
├── produccion-type-badge/
├── produccion-station-table-header/
├── produccion-station-table-row/
├── produccion-station-detail-panel/
├── produccion-recipe-table-header/
├── produccion-recipe-table-row/
├── produccion-recipe-detail-panel/
├── produccion-phase-list-item/
├── produccion-plant-map/
├── produccion-plant-station-card/
├── produccion-order-queue-row/
├── produccion-operator-activity-row/
├── produccion-plant-overview-preview/
├── produccion-stations-master-preview/
└── produccion-recipes-master-preview/
```

Names may be refined during implementation, but the namespace should remain `produccion` unless the team decides to create a more generic `plant` namespace.

---

## Required Components

| #   | Component                         | Figma source        | Purpose                                                                 |
| --- | --------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| 1   | `ProduccionPlantShell`            | `2096:110`, shared  | Header with back action, brand, plant context, alarms, live status/time |
| 2   | `ProduccionModuleTabs`            | `2096:153`, shared  | Top tabs: Mapa de planta / Configuración de maestros                    |
| 3   | `ProduccionSubTabs`               | `2096:1402`, `1887` | Subtabs: Estaciones / Recetas de producción                             |
| 4   | `ProduccionKpiCell`               | `2096:171+`         | Compact KPI cells for throughput, OEE, alarms, active stations, etc.    |
| 5   | `ProduccionFilterChipGroup`       | `2096:1429`, `1914` | Horizontal filters with active gold state                               |
| 6   | `ProduccionPrimaryAction`         | `2096:1438`, `1923` | Gold-outline action button, e.g. Nueva estación / Nueva receta          |
| 7   | `ProduccionStatusBadge`           | station/recipe rows | Active, inactive, maintenance, published, draft                         |
| 8   | `ProduccionTypeBadge`             | station rows        | Station type chips: Preparación, Procesamiento, Cocción, etc.           |
| 9   | `ProduccionStationTableHeader`    | `2096:1445`         | Columns: código, nombre, ubicación, tipo, capac., estado, recetas       |
| 10  | `ProduccionStationTableRow`       | `2096:1461+`        | Selectable station row with recipe count and chevron                    |
| 11  | `ProduccionStationDetailPanel`    | `2096:923+`         | Side panel for selected station and assigned recipes/fases              |
| 12  | `ProduccionRecipeTableHeader`     | `2096:1930`         | Columns: nombre, producto, lote, fases, tiempo total, versión, estado   |
| 13  | `ProduccionRecipeTableRow`        | `2096:1947+`        | Selectable recipe row with category subtitle and total time emphasis    |
| 14  | `ProduccionRecipeDetailPanel`     | `2096:675+`         | Recipe summary, Editar/Clonar actions and phases list                   |
| 15  | `ProduccionPhaseListItem`         | `2096:759+`         | Ordered phase card with station, duration, operators and QA marker      |
| 16  | `ProduccionPlantMap`              | `2096:168+`         | Overview layout with map area, station cards, queue and activity panels |
| 17  | `ProduccionPlantStationCard`      | `2096:350+`         | Plant overview station tile/card with operational status                |
| 18  | `ProduccionOrderQueueRow`         | `2096:579+`         | OP queue rows displayed in plant overview                               |
| 19  | `ProduccionOperatorActivityRow`   | `2096:947+`         | Activity feed rows with operator + station                              |
| 20  | `ProduccionPlantOverviewPreview`  | `2096:109`          | Full composed preview for Mapa de planta                                |
| 21  | `ProduccionStationsMasterPreview` | `2096:1343`         | Full composed preview for Estaciones                                    |
| 22  | `ProduccionRecipesMasterPreview`  | `2096:1828`         | Full composed preview for Recetas                                       |

---

## Screen Extraction Notes

### Shared Shell

The three designs share a dense dark shell:

- Top header with `← INICIO`
- Brand block: `RestOpsIQ` + `PLANT`
- Context: `Mapa de planta — Turno Mañana` and shift time pill
- Alarm chip: `4 ALARMAS` + `1 CRÍTICA`
- Live indicator: `EN VIVO`
- Current time/date
- Role label: `ROL: SUPERVISOR`

Implement this as a composable shell/header, not duplicated inside every preview.

### Mapa de Planta (`2096:109`)

The overview screen includes:

- KPI strip: Throughput, OEE Línea, Alarmas activas, Estaciones activas, Completadas hoy, T° Parrilla
- Plant stations such as Parrilla Central, Línea Fría, Frituras, Empaque y Despacho
- OP queue rows such as `OP-000012` through `OP-000016`
- Station references like `EST-03 · Parrilla Central` and `EST-05 · Frituras`
- Operator activity rows such as `J. García · EST-05 — Frituras`

The Figma node is large and may need follow-up `get_design_context` calls on sublayers during implementation.

### Estaciones (`2096:1343`)

The stations screen includes:

- Subtabs: Estaciones active, Recetas de producción inactive
- Title line: `ESTACIONES DE PRODUCCIÓN — 8 registros`
- Filters: Todas, Activa, Inactiva, Mantenimiento
- CTA: `NUEVA ESTACIÓN`
- Table columns: Código, Nombre, Ubicación, Tipo, Capac., Estado, Recetas
- Example rows: `EST-01 Mise en place`, `EST-04 Línea Fría`, `EST-08 Lavado y Sanitización`
- Status values: Activa, Inactiva, Mantenimiento
- Detail side panel for selected station with assigned recipes/fases

### Recetas de Producción (`2096:1828`)

The recipes screen includes:

- Subtabs: Estaciones inactive, Recetas de producción active
- Title line: `RECETAS DE PRODUCCIÓN — 4 recetas`
- Filters: Todas, Proteínas, Ensaladas, Acompañamientos
- CTA: `NUEVA RECETA`
- Table columns: Nombre, Producto, Lote, Fases, Tiempo total, Versión, Estado
- Example rows: Pollo asado porcionado, Costillas BBQ, Ensalada César, Papas fritas temporada
- Status values: Publicada, Borrador
- Detail side panel with category/version, KPI boxes for lote/tiempo/fases, Editar and Clonar actions, and ordered phase list

---

## Component API Guidance

Prefer data-driven props over hardcoded examples:

```ts
export type ProduccionTheme = 'light' | 'dark';
export type ProduccionSize = 'sm' | 'md' | 'xl';

export type ProduccionStationStatus = 'active' | 'inactive' | 'maintenance';
export type ProduccionRecipeStatus = 'published' | 'draft' | 'archived';

export interface ProduccionStationRowData {
  code: string;
  name: string;
  location: string;
  type: string;
  capacityLabel: string;
  status: ProduccionStationStatus;
  recipeCountLabel?: string;
  selected?: boolean;
}

export interface ProduccionRecipeRowData {
  name: string;
  category?: string;
  productName: string;
  batchSizeLabel: string;
  phaseCount: number;
  totalTimeLabel: string;
  versionLabel: string;
  status: ProduccionRecipeStatus;
  selected?: boolean;
}
```

Rows should expose `onClick`, `aria-selected` and keyboard activation. Icon-only actions must have `aria-label`.

---

## Implementation Order

1. Shared theme/types/docs helpers.
2. Atomic components: status badge, type badge, primary action, filter chips, KPI cell.
3. Navigation shell: plant shell, module tabs, sub tabs.
4. Rows and headers: station table, recipe table, phase list item.
5. Detail panels: station detail, recipe detail.
6. Plant overview components: station cards, OP queue row, activity row, plant map.
7. Preview compositions for the three Figma screens.
8. Public exports in `packages/ui/src/index.tsx`.
9. Storybook docs and validation pass.

---

## Accessibility

- Use semantic `button` elements for tabs, filters, CTAs and row actions.
- Use `aria-current` or `aria-selected` for active tabs/rows.
- Table-like layouts should expose `role="table"`, `role="row"`, `role="columnheader"` and `role="cell"` if implemented with div/grid.
- Keyboard support: Enter/Space activates selectable rows and chips.
- Touch target minimum: 44px for md where the design allows; dense desktop-only areas can use sm but previews must show tablet-safe md/xl states.
- Text contrast must remain readable on dark surfaces.

---

## Forbidden

```txt
- Tailwind in final package code
- Figma screenshots/images rendered as UI
- Remote Figma asset URLs in runtime components
- Hardcoded row counts or fixed-height tables that clip dynamic data
- Copy/pasting the same shell/header into every preview
- Duplicating existing Inventario/Receta/Proveedor button/table patterns when they can be adapted
- One huge "screen component" with no reusable atoms
```

---

## Acceptance Criteria

- [ ] `packages/ui/src/components/produccion/` exists with shared theme/types/docs helpers.
- [ ] All required components have `.tsx`, `.module.scss`, `.stories.tsx` and `index.ts`.
- [ ] Components support `theme` and `size` with Storybook controls.
- [ ] Storybook namespace `Produccion/*` includes all components and three composed previews.
- [ ] `ProduccionStationsMasterPreview` matches Figma node `2096:1343` at desktop width.
- [ ] `ProduccionRecipesMasterPreview` matches Figma node `2096:1828` at desktop width.
- [ ] `ProduccionPlantOverviewPreview` matches Figma node `2096:109` closely enough for design review, with follow-up sublayer inspection if needed.
- [ ] Station and recipe tables grow with arbitrary row arrays and support horizontal overflow on narrow widths.
- [ ] Selected row states and side panels are represented in stories.
- [ ] Status/type badges cover all statuses visible in Figma: active, inactive, maintenance, published and draft.
- [ ] Phase list item supports duration, station, operator range and QA marker.
- [ ] All public components are exported from `packages/ui/src/index.tsx`.
- [ ] No hardcoded colors in TSX and no Tailwind classes in final implementation.
- [ ] `pnpm --filter @restopsiq/ui typecheck` passes.

---

## Validation

```bash
pnpm --filter @restopsiq/ui storybook
pnpm --filter @restopsiq/ui typecheck
```

Manual Storybook review:

1. `Produccion/ProduccionPlantOverviewPreview`
2. `Produccion/ProduccionStationsMasterPreview`
3. `Produccion/ProduccionRecipesMasterPreview`
4. `theme` and `size` controls for each atomic component
5. Keyboard focus, selected rows and side-panel states

### Implementation Notes

- Implemented `packages/ui/src/components/produccion/` with shared theme/types/docs helpers.
- Added public exports in `packages/ui/src/index.tsx`.
- `pnpm --filter @restopsiq/ui typecheck` passes.
- Targeted ESLint for `src/components/produccion/**/*.tsx` (excluding stories due current package lint config) passes.
