# Task: Inventario UI Components (Figma) - `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[FIGMA]` `[INVENTARIO]`
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer
**Status:** `done`
**Created:** 2026-05-29
**Completed:** 2026-05-29
**Depends On:** `06-receta-figma-components.md`, `07-proveedor-figma-components.md`

---

# Resumen de lo implementado

Módulo **Inventario** en `packages/ui/src/components/inventario/`: **31 componentes** + **5 composiciones de pantalla** (previews), extraídos de **6 pantallas** del archivo Figma Opssynk.

- Misma metodología que Receta/Proveedor: `theme` / `size`, CSS Modules, tokens en `_inventario-theme.scss`, Storybook bajo `Inventario/*`.
- **Default:** `theme='light'` en componentes y en `inventarioStoryMeta` (canvas Storybook `#f6f4ef`).
- Cada story incluye `tags: ['autodocs']`, descripción en español y enlace Figma dev mode (`inventario-story-docs.ts`).
- Export público desde `@restopsiq/ui` (`packages/ui/src/index.tsx`).
- `pnpm --filter @restopsiq/ui typecheck` pasa.

---

# Figma Source File

| Field     | Value                                                         |
| --------- | ------------------------------------------------------------- |
| File name | Opssynk                                                       |
| File key  | `owd5wBmVJgUE9n9MeOHxYb`                                      |
| Base URL  | `https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk` |

## Pantallas (composiciones `*Preview`)

| Pantalla                | Node ID     | Storybook                                  | Componentes principales                                                         |
| ----------------------- | ----------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| Dashboard de Inventario | `2075:598`  | `Inventario/InventarioDashboardPreview`    | TopBar, PageHeader, MetricCard×4, Panel, BarRow, BarChart                       |
| Gestión de Productos    | `2075:1016` | `Inventario/InventarioProductsPreview`     | PageToolbar, FilterToolbar, TableHeader/Row, Pagination                         |
| Modal Editar Producto   | `2075:1463` | `Inventario/InventarioProductModalPreview` | Modal, FormField, FormActions (+ listado productos)                             |
| Movimientos de Stock    | `2075:1662` | `Inventario/InventarioMovementsPreview`    | PageToolbar, FilterToolbar, TableHeader/Row (movement)                          |
| Alertas de Stock Bajo   | `2075:1910` | `Inventario/InventarioAlertsPreview`       | PageToolbar, TableHeader/Row (alert), IconButton ordenar/resolver               |
| Reportes de Inventario  | `2075:2185` | `Inventario/InventarioReportsPreview`      | ReportFilterBar, ExportActions, ReportDataTable, DistributionBar, SummaryStat×4 |

Enlaces dev mode: `?node-id=<id con guiones>&m=dev` (helper `inventarioFigmaLink`).

---

# Catálogo de componentes

| #                     | Carpeta / componente               | Node Figma (ref.) | Descripción breve                                                                 |
| --------------------- | ---------------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| **Shared**            |
| —                     | `shared/inventario-types.ts`       | —                 | `InventarioTheme`, `InventarioSize`, acentos, variantes tabla/movimiento/alerta   |
| —                     | `shared/inventario-columns.ts`     | —                 | Grid CSS `product` / `movement` / `alert` / `report` + defs de columnas           |
| —                     | `shared/_inventario-theme.scss`    | —                 | Tokens light/dark, mixins control, botón ghost, overlay modal                     |
| —                     | `shared/inventario-story-docs.ts`  | —                 | Textos Docs + `inventarioComponentDocs()` + `INVENTARIO_FIGMA_BASE`               |
| —                     | `shared/story-decorators.tsx`      | —                 | `inventarioThemeDecorator`, `inventarioStoryMeta` (default light)                 |
| **Dashboard**         |
| 1                     | `inventario-top-bar`               | `2075:599`        | Barra superior: ContextBadge, contexto operativo                                  |
| 2                     | `inventario-context-badge`         | `2075:601`        | Pill planta (dot) / turno (reloj)                                                 |
| 3                     | `inventario-page-header`           | `2075:636`        | Título + subtítulo de página                                                      |
| 4                     | `inventario-metric-card`           | `2075:643+`       | KPI con borde de acento e icono opcional                                          |
| 5                     | `inventario-panel`                 | `2075:686`        | Contenedor con título de sección                                                  |
| 6                     | `inventario-bar-row`               | `2075:690+`       | Fila label + valor + barra de progreso                                            |
| 7                     | `inventario-bar-chart`             | `2075:834`        | Barras verticales histórico (light: texto negro, barras sólidas; dark: gradiente) |
| 8                     | `inventario-dashboard-preview`     | `2075:598`        | Composición pantalla dashboard                                                    |
| **Listados / tabla**  |
| 9                     | `inventario-search`                | `2075:1034`       | Input búsqueda con icono y limpiar                                                |
| 10                    | `inventario-select`                | `2075:1036`       | Select nativo estilizado (categoría / proveedor)                                  |
| 11                    | `inventario-filter-toolbar`        | `2075:1030`       | **Fila horizontal:** búsqueda + 2 selects + checkbox «Stock Bajo» en panel        |
| 12                    | `inventario-page-toolbar`          | `2075:1018`       | Título, subtítulo meta y CTA (p. ej. CREAR PRODUCTO)                              |
| 13                    | `inventario-primary-button`        | `2075:1022`       | Variantes `primary` / `success` / `danger` / `ghost`                              |
| 14                    | `inventario-icon-button`           | `2075:1062`       | `edit` / `delete` / `view` / `order` / `resolve` (autodocs)                       |
| 15                    | `inventario-table-header`          | `2075:1044`       | Cabecera grid por variante `product` \| `movement` \| `alert`                     |
| 16                    | `inventario-table-row`             | `2075:1053+`      | Fila por variante; stock con tono + alerta stock bajo en productos                |
| 17                    | `inventario-status-badge`          | `2075:1680`       | Tipo movimiento o severidad alerta                                                |
| 18                    | `inventario-pagination`            | `2075:1154`       | Resumen página + Anterior / Siguiente                                             |
| **Modal producto**    |
| 19                    | `inventario-form-field`            | `2075:1475+`      | Label uppercase + input / select / slot children                                  |
| 20                    | `inventario-form-actions`          | `2075:1511`       | Cancelar + Guardar (verde)                                                        |
| 21                    | `inventario-modal`                 | `2075:1463`       | Overlay, header, body, footer con FormActions                                     |
| 22                    | `inventario-product-modal-preview` | `2075:1463`       | Productos + modal edición (SKU, precios, stocks min/max)                          |
| **Pantallas listado** |
| 23                    | `inventario-products-preview`      | `2075:1016`       | TopBar + toolbar + tabla productos + paginación                                   |
| 24                    | `inventario-movements-preview`     | `2075:1662`       | Movimientos con badges entrada/salida/consumo/ajuste                              |
| 25                    | `inventario-alerts-preview`        | `2075:1910`       | Alertas críticas / warning con acciones fila                                      |
| **Reportes**          |
| 26                    | `inventario-report-filter-bar`     | `2075:2192`       | Tipo reporte + fecha inicio/fin + GENERAR (fila en panel)                         |
| 27                    | `inventario-export-actions`        | `2075:2208`       | EXPORTAR CSV (verde) + EXPORTAR PDF (rojo), alineados derecha                     |
| 28                    | `inventario-report-data-table`     | `2075:2225`       | Tabla Categoría / Cantidad / %                                                    |
| 29                    | `inventario-distribution-bar`      | `2075:2267+`      | Barra horizontal por categoría (panel Visualización)                              |
| 30                    | `inventario-summary-stat`          | `2075:2317`       | Stat con `accent` en el valor (resumen período ×4)                                |
| 31                    | `inventario-reports-preview`       | `2075:2185`       | Layout completo: filtros → export → datos + visualización → resumen               |

**Convención por carpeta:** `Component.tsx`, `Component.module.scss`, `Component.stories.tsx`, `index.ts`.

---

# Detalle por pantalla (qué ensambla cada preview)

### Dashboard (`2075:598`)

- `InventarioTopBar` → `InventarioPageHeader` → fila de 4× `InventarioMetricCard`
- 2× `InventarioPanel` con listas `InventarioBarRow` (top productos, stock por sede)
- `InventarioPanel` + `InventarioBarChart` (histórico 30 días)

### Productos (`2075:1016`)

- `InventarioPageToolbar` («Gestión de Productos», meta total/página, CREAR PRODUCTO)
- `InventarioFilterToolbar` en **una línea** (buscar SKU/nombre, categoría, proveedor, Stock Bajo)
- Tabla: `InventarioTableHeader` + `InventarioTableRow` (`variant="product"`) + `InventarioPagination`
- Acciones fila: `InventarioIconButton` edit / delete

### Modal producto (`2075:1463`)

- Campos: SKU, Nombre, Categoría, Proveedor, Precio Costo/Venta, Stock Mínimo/Máximo
- `InventarioModal` + grid `InventarioFormField` + `InventarioFormActions`

### Movimientos (`2075:1662`)

- Toolbar + tabla `variant="movement"` + `InventarioStatusBadge` (entrada / salida / consumo / ajuste)

### Alertas (`2075:1910`)

- Tabla `variant="alert"` + severidad + `InventarioIconButton` order / resolve

### Reportes (`2075:2185`)

- `InventarioPageHeader` con subtítulo export CSV/PDF
- `InventarioReportFilterBar` (horizontal)
- `InventarioExportActions`
- Grid 2 columnas: `InventarioReportDataTable` | `InventarioPanel` «Visualización» con `InventarioDistributionBar`
- `InventarioPanel` «Resumen del Período» con 4× `InventarioSummaryStat` (acentos success / info / purple / enterprise)

---

# Tablas — columnas (`inventario-columns.ts`)

| Variante   | Columnas                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| `product`  | SKU, Nombre, Categoría, Proveedor, Stock Total, Precio Unit., Último Mov., Acciones |
| `movement` | Fecha, Producto, Tipo, Cantidad, Usuario, Referencia                                |
| `alert`    | Severidad, Producto, Stock Actual, Stock Mín., Proveedor, Acciones                  |
| `report`   | Categoría, Cantidad, %                                                              |

---

# Ubicación en código

```txt
packages/ui/src/components/inventario/
├── shared/
│   ├── inventario-types.ts
│   ├── inventario-columns.ts
│   ├── _inventario-theme.scss
│   ├── inventario-story-docs.ts
│   └── story-decorators.tsx
├── inventario-alerts-preview/
├── inventario-bar-chart/
├── inventario-bar-row/
├── inventario-context-badge/
├── inventario-dashboard-preview/
├── inventario-distribution-bar/
├── inventario-export-actions/
├── inventario-filter-toolbar/
├── inventario-form-actions/
├── inventario-form-field/
├── inventario-icon-button/
├── inventario-metric-card/
├── inventario-modal/
├── inventario-movements-preview/
├── inventario-page-header/
├── inventario-page-toolbar/
├── inventario-pagination/
├── inventario-panel/
├── inventario-primary-button/
├── inventario-product-modal-preview/
├── inventario-products-preview/
├── inventario-report-data-table/
├── inventario-report-filter-bar/
├── inventario-reports-preview/
├── inventario-search/
├── inventario-select/
├── inventario-status-badge/
├── inventario-summary-stat/
├── inventario-table-header/
├── inventario-table-row/
└── inventario-top-bar/
```

**Storybook:** namespace `Inventario/*` (un story por componente + stories `*Preview`).

**Paquete:** import desde `@restopsiq/ui` — ver bloque `export * from './components/inventario/...'` en `packages/ui/src/index.tsx` (líneas ~102–134).

---

# Requisitos globales (aplicados)

| Requisito       | Implementación                                                                       |
| --------------- | ------------------------------------------------------------------------------------ |
| Temas           | `theme?: 'light' \| 'dark'`, clases `theme--light` / `theme--dark`                   |
| Tamaños         | `size?: 'sm' \| 'md' \| 'xl'`, variables `--control-*` vía `inventario-size-vars`    |
| Estilos         | CSS Modules; colores semánticos en SCSS (`$inventario-success`, etc.), no hex en TSX |
| Storybook       | `inventarioStoryMeta`, `inventarioThemeDecorator`, `tags: ['autodocs']`              |
| Stories típicas | `Default`, `DarkMode`, `LightMode`, `Sizes` (donde aplica)                           |
| Iconos          | `lucide-react`                                                                       |

### Ajustes de diseño posteriores

- **Light mode:** texto principal negro; gráfico de barras sin degradado a blanco en light.
- **FilterToolbar:** layout horizontal tipo recetas (panel único, sin wrap en desktop).
- **Reportes:** estructura alineada a Figma (filtros en línea, export derecha, split datos/visualización, 4 KPIs con color).
- **IconButton:** `tags: ['autodocs']` explícito en meta de stories.

---

# Pendiente (fuera de alcance actual)

- [ ] Capturas PNG en `tasks/packages-ui/design-references/inventario/` y revisión pixel-perfect
- [ ] Integración en `apps/web-app` (rutas pantallas inventario)
- [ ] Code Connect Figma ↔ código (opcional)

---

# Validación

```bash
pnpm --filter @restopsiq/ui storybook
pnpm --filter @restopsiq/ui typecheck
```

Revisar en Storybook:

1. Pestaña **Docs** en cada entrada `Inventario/*`
2. Composiciones `InventarioDashboardPreview`, `InventarioProductsPreview`, `InventarioProductModalPreview`, `InventarioMovementsPreview`, `InventarioAlertsPreview`, `InventarioReportsPreview`
3. Controles `theme` / `size` con default **light**
