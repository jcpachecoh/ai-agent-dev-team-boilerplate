# Task: Módulo de Inventario — `apps/web-app`

**Domain:** `[FRONTEND]` `[WEB-APP]` `[INVENTARIO]` `[CRUD]` `[API]`
**Assigned Agent:** frontend-developer, ui-engineer
**Status:** `done`
**Created:** 2026-05-29
**Depends On:** `tasks/web-app/01-layout-shell-sidebar.md`, `tasks/packages-ui/07-inventario-figma-components.md`

---

## Objetivo

Implementar en **Frontend** el módulo de **Inventario** en `apps/web-app`: administrar productos e insumos (listado, CRUD, detalle), movimientos, alertas y reportes.

La UI debe **componerse componente a componente** desde `@restopsiq/ui` (`packages/ui/src/components/inventario/`), **no** montar las stories `*Preview` como pantallas finales. Las previews de Storybook son referencia de ensamblado; en web-app cada pieza se integra con datos, handlers y estados reales.

**Tema por defecto en pantallas:** `theme="dark"` (dashboard Figma + shell oscuro). Sidebar Inventario: acento **verde**; Recetas: **morado** (ver `navigation.ts` + `SidebarAccent`).

---

## Alcance

| Incluye                                                     | No incluye (fase posterior)                             |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| Rutas `/inventory/*` con pantallas funcionales              | Pixel-perfect audit vs PNG si no hay export             |
| CRUD productos/insumos + modal + validaciones               | Purchase Order completo (solo stub/modal desde alertas) |
| Dashboard KPIs + gráficos (datos API o mock acotado)        | Backend nuevo si no existe contrato                     |
| Movimientos, alertas, reportes (tablas + filtros)           | Code Connect Figma                                      |
| Detalle producto `/inventory/products/:id`                  |                                                         |
| Loading / empty / error + toasts                            |                                                         |
| Refresh dashboard 30s + WebSocket (AC8) si API expone canal |                                                         |

---

## Referencias visuales

### Figma (Opssynk)

| Pantalla       | Node ID     | URL dev mode                                                                                 |
| -------------- | ----------- | -------------------------------------------------------------------------------------------- |
| Dashboard      | `2075:598`  | [Abrir](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2075-598&m=dev)  |
| Productos      | `2075:1016` | [Abrir](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2075-1016&m=dev) |
| Modal producto | `2075:1463` | [Abrir](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2075-1463&m=dev) |
| Movimientos    | `2075:1662` | [Abrir](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2075-1662&m=dev) |
| Alertas        | `2075:1910` | [Abrir](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2075-1910&m=dev) |
| Reportes       | `2075:2185` | [Abrir](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2075-2185&m=dev) |

Documentación de componentes UI: `tasks/packages-ui/07-inventario-figma-components.md`.

### Capturas de referencia (web-app)

Guardar o vincular capturas en:

```txt
tasks/web-app/design-references/inventario/
├── dashboard.png          # KPIs + Top 10 + Stock por sede + histórico 30d
├── products.png           # Tabla + filter toolbar horizontal + paginación
├── product-modal.png      # Editar producto (campos + Guardar/Cancelar)
├── movements.png          # Tabla movimientos + filtros fecha/tipo/sede + CSV
├── alerts.png             # KPIs severidad + tabla + Ordenar/Resolver
└── reports.png            # Filtros + export + datos/visualización + resumen
```

---

## Principio de implementación UI

```txt
❌ No:  <InventarioProductsPreview theme="light" />
✅ Sí:  Componer en screen con estado:

        <InventarioPageToolbar ... onAction={openCreate} />
        <InventarioFilterToolbar searchValue={q} onSearchChange={setQ} ... />
        <InventarioTableHeader variant="product" />
        {rows.map(row => <InventarioTableRow key={row.id} variant="product" ... />)}
        <InventarioPagination page={page} totalPages={total} ... />
```

Importar desde `@restopsiq/ui` (ver exports en `packages/ui/src/index.tsx`).

**Shell global** (sidebar, header planta/turno, búsqueda sistema): layout de `01-layout-shell-sidebar` — **no** duplicar `InventarioTopBar` en cada pantalla salvo que el diseño de producto exija contexto solo en dashboard.

---

## Mapeo pantalla → componentes `@restopsiq/ui`

### AC 1 — Rutas (`App.tsx` + pages)

| Ruta                      | Page                         | Screen                         |
| ------------------------- | ---------------------------- | ------------------------------ |
| `/inventory`              | `InventoryDashboardPage`     | `InventoryDashboardScreen`     |
| `/inventory/products`     | `InventoryProductsPage`      | `InventoryProductsScreen`      |
| `/inventory/products/:id` | `InventoryProductDetailPage` | `InventoryProductDetailScreen` |
| `/inventory/movements`    | `InventoryMovementsPage`     | `InventoryMovementsScreen`     |
| `/inventory/alerts`       | `InventoryAlertsPage`        | `InventoryAlertsScreen`        |
| `/inventory/reports`      | `InventoryReportsPage`       | `InventoryReportsScreen`       |

Patrón igual que Recetas: `pages/*` delgadas (`useLocation` / `useParams`) → `screens/*` con lógica.

Rutas hijas ya existen en `App.tsx` pero hoy todas apuntan a `InventoryPage` placeholder — **reemplazar** por pages específicas.

---

### AC 2 — Dashboard (`/inventory`)

**Referencia:** captura dashboard (KPIs + 3 bloques de datos).

| Bloque UI                      | Componente(s)                              | Notas                                                                                               |
| ------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Título + subtítulo refresh 30s | `InventarioPageHeader`                     | Subtítulo: «Actualización automática cada 30s»                                                      |
| Fila KPI ×4                    | `InventarioMetricCard` ×4                  | Iconos: `Box`, `DollarSign`, `AlertTriangle`, `ArrowLeftRight`; acentos success/info/warning/purple |
| Panel Top 10                   | `InventarioPanel` + `InventarioBarRow` ×10 | `density="compact"`, acentos por nivel stock                                                        |
| Panel Stock por sede           | `InventarioPanel` + `InventarioBarRow` ×N  | Valores en %                                                                                        |
| Panel Histórico 30 días        | `InventarioPanel` + `InventarioBarChart`   | Serie `InventarioBarChartItem[]`                                                                    |
| Auto-refresh                   | `useEffect` + `setInterval(30_000)`        | Refetch KPIs/gráficos sin reload; invalidar cache React Query si aplica                             |

**Datos esperados (validación):**

- Total items: `1,250`
- Valor total: `sum(costPrice × currentStock)`
- Stock bajo: count alertas no resueltas → `5 items`
- Movimientos hoy: count `createdAt = hoy` → `12`

---

### AC 3 — Productos CRUD (`/inventory/products`)

**Referencia:** captura productos (toolbar horizontal + tabla).

| Bloque UI          | Componente(s)             | Props / comportamiento                                                                                  |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| Encabezado         | `InventarioPageToolbar`   | Título «Gestión de Productos», meta «Total: N productos • Página X de Y», CTA `CREAR PRODUCTO`          |
| Filtros en línea   | `InventarioFilterToolbar` | `InventarioSearch` + 2× `InventarioSelect` + checkbox «Stock Bajo»                                      |
| Tabla cabecera     | `InventarioTableHeader`   | `variant="product"`                                                                                     |
| Filas              | `InventarioTableRow`      | `variant="product"`, `stockTone`, `lowStockWarning`, SKU link → `navigate(/inventory/products/:id)`     |
| Acciones fila      | `InventarioIconButton`    | `edit` → modal; `delete` → confirmación                                                                 |
| Pie                | `InventarioPagination`    | 20 ítems/página, Anterior/Siguiente, texto «Página 1 de 10»                                             |
| Modal alta/edición | `InventarioModal`         | Body: grid `InventarioFormField` (SKU, Nombre, Categoría, Proveedor, Precio Costo/Venta, Stock Mín/Máx) |
| Pie modal          | `InventarioFormActions`   | Cancelar / Guardar                                                                                      |
| Feedback           | `Toast` (`@restopsiq/ui`) | Éxito/error tras create/update/delete                                                                   |

**Validaciones formulario:**

- Campos obligatorios
- `costPrice < sellingPrice` → mensaje inline en `InventarioFormField`
- SKU único (error API → toast + inline)

**Filtros:**

- Search: filtro client o query `?q=` debounced
- Categoría / Supplier: `InventarioSelect`
- Stock bajo: `currentStock < minimumStock`

**Eliminar:** confirmación nativa o dialog; API `DELETE` / `PATCH isActive: false` (soft delete).

---

### AC 4 — Movimientos (`/inventory/movements`)

**Referencia:** captura movimientos.

| Bloque UI  | Componente(s)                                  | Notas                                                                                                                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Encabezado | `InventarioPageToolbar`                        | Meta «Total: N movimientos», CTA secundario `DESCARGAR CSV` (`InventarioPrimaryButton` variant success + icono)                                                                                                                                                                                                                    |
| Filtros    | **Extender** toolbar o `screen` local          | Figma: search producto + tipo + sede + **rango fechas** (2 inputs `type="date"` en `InventarioFormField` o fila custom). `InventarioFilterToolbar` actual no incluye fechas — añadir props `dateStart`/`dateEnd` o subcomponente `InventoryMovementsFilterBar` en `screens/` que reutilice `InventarioSearch` + `InventarioSelect` |
| Tabla      | `InventarioTableHeader` + `InventarioTableRow` | `variant="movement"`                                                                                                                                                                                                                                                                                                               |
| Tipo       | `InventarioStatusBadge`                        | `entrada` / `salida` / `consumo` / `ajuste`                                                                                                                                                                                                                                                                                        |
| Cantidad   | celda en row                                   | Verde `↑` positivo, rojo `↓` negativo (props en row o SCSS screen)                                                                                                                                                                                                                                                                 |

**Columnas:** Fecha, Tipo, Producto, Cantidad, Sede, Usuario, Razón (mapear a API cuando exista; hasta entonces mock tipado).

**CSV:** generar `movements_YYYY-MM-DD.csv` desde dataset filtrado.

---

### AC 5 — Alertas (`/inventory/alerts`)

**Referencia:** captura alertas.

| Bloque UI            | Componente(s)                                    | Notas                                                                                                                           |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Encabezado           | `InventarioPageHeader` o `InventarioPageToolbar` | «Alertas de Stock Bajo», «N alertas pendientes»                                                                                 |
| Resumen severidad ×3 | `InventarioMetricCard` ×3                        | CRÍTICO (danger), ADVERTENCIA (warning), RESUELTAS HOY (success) — **no** está en `InventarioAlertsPreview`; componer en screen |
| Tabla                | `InventarioTableHeader` + `InventarioTableRow`   | `variant="alert"`                                                                                                               |
| Severidad            | `InventarioStatusBadge`                          | `critical` / `warning` / `resolved`                                                                                             |
| Acciones             | `InventarioIconButton`                           | `order` → modal PO (stub); `resolve` → PATCH `isResolved`                                                                       |

**Reglas severidad (UI):**

- CRITICAL: `stock < threshold * 0.5`
- WARNING: entre 0.5× y 1× threshold
- INFO: `stock >= threshold` (si se muestran)

---

### AC 6 — Reportes (`/inventory/reports`)

**Referencia:** captura reportes.

| Bloque UI            | Componente(s)                                                                | Notas                                        |
| -------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| Encabezado           | `InventarioPageHeader`                                                       | Subtítulo export CSV/PDF                     |
| Filtros horizontales | `InventarioReportFilterBar`                                                  | Tipo + fecha inicio/fin + GENERAR            |
| Export               | `InventarioExportActions`                                                    | CSV verde, PDF rojo                          |
| Columna izquierda    | `InventarioReportDataTable`                                                  | Categoría, cantidad (verde), %               |
| Columna derecha      | `InventarioPanel` «Visualización» + `InventarioDistributionBar` × categorías | Acentos por categoría                        |
| Resumen              | `InventarioPanel` «Resumen del Período» + `InventarioSummaryStat` ×4         | Items, valor promedio, movimientos, rotación |

**Tipos de reporte (select):** Por categoría, Por sede, Consumo en recetas, Historial ajustes.

**Responsive (AC9):** grid 2 cols tablet, 1 col mobile en `InventoryReportsScreen.module.scss`.

---

### AC 7 — Detalle producto (`/inventory/products/:id`)

Pantalla nueva (sin preview dedicado en UI package).

| Bloque UI           | Componente(s)                                                          | Notas                                                                              |
| ------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Cabecera            | `InventarioPageHeader` + acciones                                      | Nombre, SKU, volver a listado                                                      |
| Info general        | `InventarioPanel` + `InventarioFormField` read-only o layout dl        | Categoría, supplier, precios, margen calculado, min/max stock                      |
| Stock por sede      | `InventarioTableHeader` + filas custom o extender `InventarioTableRow` | Sede, actual, reservado, disponible + `InventarioPrimaryButton` «Ajustar» por fila |
| Modal ajuste        | `InventarioModal`                                                      | Cantidad + razón                                                                   |
| Últimos movimientos | `InventarioTableHeader` + `InventarioTableRow` `variant="movement"`    | Top 20 DESC                                                                        |

---

## Capa de datos / API

### Contrato actual (implementado en repo)

| Recurso      | Base path                                 | Uso en inventario                                                                                  |
| ------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Supply Items | `GET/POST/PATCH/DELETE /api/supply-items` | **Productos e insumos** (mapear SKU ↔ `codigoInterno`, nombre, categoría, stocks, CPP, `isActive`) |
| Auth         | `/api/auth/*`                             | Bearer + refresh; 401 → login                                                                      |

Headers: `Authorization: Bearer`, `x-tenant-id`.

Spec: `specs/supply-items-api.md`, colección Postman `postman/restopsiq-api.collection.json`.

### Contrato por definir (documentar en `apps/web-app/src/api/inventory/` al implementar)

| Recurso              | Endpoints sugeridos                                      | Pantallas |
| -------------------- | -------------------------------------------------------- | --------- |
| Dashboard aggregates | `GET /api/inventory/dashboard`                           | AC2       |
| Movements            | `GET /api/inventory/movements?from&to&type&site&product` | AC4       |
| Alerts               | `GET/PATCH /api/inventory/alerts`                        | AC5       |
| Reports              | `GET /api/inventory/reports?type&from&to`                | AC6       |
| Stock by site        | `GET /api/inventory/products/:id/stock-by-site`          | AC7       |
| WebSocket            | canal `inventory` o eventos                              | AC8       |

Hasta que existan: **mock service** en `src/mocks/inventory/` con mismas interfaces que el contrato final, switch por `VITE_USE_MOCK_INVENTORY=true`.

### Producto vs insumo

Si el backend distingue tipos (campos/validaciones distintos), documentar en `src/types/inventory.ts` y bifurcar campos del modal (`itemType: 'product' | 'supply'`). Si solo hay `SupplyItem`, tratar ambos como el mismo formulario con categoría semántica.

---

## Estructura de código propuesta

```txt
apps/web-app/src/
├── api/
│   └── inventory/
│       ├── client.ts              # fetch wrapper, 401 handler
│       ├── supplyItems.ts         # CRUD → /api/supply-items
│       ├── dashboard.ts
│       ├── movements.ts
│       ├── alerts.ts
│       └── reports.ts
├── types/
│   └── inventory.ts
├── hooks/
│   ├── useInventoryProducts.ts
│   ├── useInventoryDashboard.ts
│   └── ...
├── screens/
│   ├── InventoryDashboardScreen/
│   ├── InventoryProductsScreen/
│   ├── InventoryProductDetailScreen/
│   ├── InventoryMovementsScreen/
│   ├── InventoryAlertsScreen/
│   └── InventoryReportsScreen/
├── pages/
│   ├── InventoryDashboardPage/
│   ├── InventoryProductsPage/
│   ├── InventoryProductDetailPage/
│   ├── InventoryMovementsPage/
│   ├── InventoryAlertsPage/
│   └── InventoryReportsPage/
└── components/inventory/          # Solo piezas NO cubiertas por @restopsiq/ui
    ├── InventoryMovementsFilterBar/   # opcional: fechas + selects
    ├── ProductDeleteConfirm/
    └── PurchaseOrderStubModal/
```

Cada screen: `*.tsx`, `*.module.scss`, `*.test.tsx` (smoke + interacciones críticas), `index.ts`.

---

## Requerimientos funcionales (resumen AC)

Como usuario:

1. Veo lista paginada de productos/insumos con búsqueda y filtros.
2. Creo/edito con validaciones y mensajes de éxito/error.
3. Elimino/desactivo con confirmación.
4. Veo detalle con stock por sede y movimientos recientes.
5. Consulto dashboard, movimientos, alertas y reportes según rutas anteriores.

---

## Criterios de aceptación detallados

### AC 1: Rutas principales

- [ ] `GET` navegación (React Router) retorna 200 en cada ruta listada (sin error de render).
- [ ] Sidebar marca activo el hijo de Inventario correcto (`navigation.ts` ya definido).

### AC 2: Dashboard KPIs

- [ ] Cuatro `InventarioMetricCard` con valores correctos desde API/mock.
- [ ] Tres paneles con gráficos visibles (bar rows ×2, bar chart ×1).
- [ ] Refresh cada 30s sin `window.location.reload`.

### AC 3: Tabla productos CRUD

- [ ] Columnas: SKU (link), Nombre, Categoría, Supplier, Stock Total, Precio unit., Último mov., Acciones.
- [ ] Búsqueda «POLLO» filtra resultados.
- [ ] Filtros categoría, supplier, stock bajo.
- [ ] Paginación 20/página, anterior/siguiente, contador.
- [ ] Modal crear/editar con validaciones; soft delete; toasts.

### AC 4: Movimientos

- [ ] Columnas y badges de tipo coloreados.
- [ ] Filtros fecha, tipo, sede, producto.
- [ ] Descarga CSV con columnas completas.

### AC 5: Alertas

- [ ] Columnas producto, stock, threshold, diferencia, severidad, acciones.
- [ ] Colores severidad; Ordenar (stub PO); Resolver quita de lista pendiente.

### AC 6: Reportes

- [ ] Select tipo + rango fechas + Generar.
- [ ] Tabla + visualización + export CSV/PDF.

### AC 7: Detalle

- [ ] Info general, tabla stock por sede, ajuste, últimos 20 movimientos.

### AC 8: Real-time

- [ ] WebSocket o polling: KPI dashboard y alertas nuevas &lt; 2s (cuando backend disponible).

### AC 9: Responsive

- [ ] Tablas scroll horizontal &lt; 640px; touch targets ≥ 48px botones, ≥ 44px inputs.
- [ ] Reportes: 2 cols tablet, 3/1 según breakpoint en diseño.

### AC 10: Errores

- [ ] Toast rojo en fallos de carga/operación.
- [ ] Validación inline en formulario precios.
- [ ] 401 → redirect login.

---

## Estados UX obligatorios

En cada screen con fetch:

| Estado  | UI                                             |
| ------- | ---------------------------------------------- |
| Loading | skeleton o spinner en tabla/paneles            |
| Empty   | mensaje + CTA si aplica (ej. «Crear producto») |
| Error   | toast + botón reintentar                       |

---

## Validación local

```bash
pnpm --filter web-app dev
pnpm --filter web-app test
pnpm --filter web-app typecheck
pnpm --filter @restopsiq/ui storybook   # referencia componentes Inventario/*
```

Checklist manual:

1. Navegar todas las rutas AC1 dentro del layout shell.
2. Comparar cada pantalla con PNG en `design-references/inventario/`.
3. Verificar `theme="light"` y legibilidad de texto.
4. Probar CRUD producto end-to-end contra API o mock.

---

## Notas de implementación

- **No copiar** estilos desde `*Preview.module.scss` del paquete UI; el layout de contenido vive en `apps/web-app/src/screens/*.module.scss` (solo spacing/max-width).
- Reutilizar patrón **Recetas**: `RecipesPage` → `RecipesManagementScreen` con imports granulares de `@restopsiq/ui`.
- Toasts: montar provider de `@restopsiq/ui` en `App` o layout si aún no está.
- Confirm delete: dialog accesible (focus trap) antes de soft delete.
- Cuando `01-layout-shell-sidebar` esté `done`, el inventario solo rellena el `<Outlet />` del main; badges sidebar (5 alertas) pueden enlazarse a count real vía contexto o prop drilling futuro.

---

## Definición de hecho

- [x] Todas las rutas AC1 implementadas con screens reales (sin `ModulePlaceholderPage` en inventario).
- [x] Cada pantalla ensamblada con componentes `inventario-*` de `@restopsiq/ui` según tablas de este documento.
- [x] AC3 CRUD productos funcional contra `/api/supply-items` o mock documentado.
- [x] Tests smoke por screen y al menos un test de integración CRUD productos.
- [x] Typecheck y test de `web-app` en verde.
