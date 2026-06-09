# WEB-PROV-01 — UI Gestión de Proveedores (mock + `@restopsiq/ui`)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PROVEEDORES]` `[UI]`  
**Assigned Agent:** frontend-developer, ui-engineer  
**Status:** `done`  
**Depends On:** `tasks/web-app/01-layout-shell-sidebar.md`  
**Blocks:** `02-api-integration-react-query.md`  
**Route base:** `/proveedores`  
**Page entry:** `apps/web-app/src/pages/ProveedoresPage`

---

## Objetivo

Reemplazar el placeholder de `ProveedoresPage` por el módulo completo de proveedores usando **solo componentes de `@restopsiq/ui`**, con datos **mock locales** (sin fetch). La UI debe coincidir con los mockups de referencia (tema oscuro dentro del shell de la app).

**No** incluir React Query ni llamadas API en esta tarea.

---

## Componentes UI disponibles (`@restopsiq/ui`)

Componer pantallas importando desde el paquete (ya exportados en `packages/ui/src/index.tsx`):

| Componente                                                                   | Uso                                                            |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ProveedorPageHeader`                                                        | Título "SUPPLIER MANAGEMENT", subtítulo, botón volver          |
| `ProveedorMetricCard` × 4                                                    | KPIs: activos, pendientes, saldo CXP, total productos          |
| `ProveedorListToolbar`                                                       | Búsqueda + slots para filtros + Exportar + Nuevo proveedor     |
| `ProveedorSuppliersTable` / `ProveedorTableRow`                              | Tabla lista                                                    |
| `ProveedorStatusBadge`                                                       | ACTIVO / INACTIVO / PENDIENTE                                  |
| `ProveedorFormHeader`, `ProveedorFormSection`, `ProveedorFormActions`        | Crear / editar                                                 |
| `ProveedorDetailHeader`                                                      | Cabecera detalle (nombre, NIT, badge, Contactar, Editar)       |
| `ProveedorDetailTabBar`                                                      | Tabs: info, catalog, history, quality, payables                |
| `ProveedorContactPanel`, `ProveedorMetricsPanel`                             | Tab información                                                |
| `ProveedorCatalogTable`, `ProveedorCatalogTableRow`, `ProveedorProductModal` | Tab catálogo (modal OK en esta fase)                           |
| `RecetaFilterSelect`                                                         | Filtros estado y condición de pago (reutilizar patrón recetas) |
| `Input`, `Button`, `EmptyState`, `Dialog` (forms)                            | Campos del formulario proveedor                                |

Usar `theme="dark"` en componentes Proveedor donde el mock lo requiera.

---

## Estructura de archivos propuesta

```txt
apps/web-app/src/
├── pages/ProveedoresPage/
│   ├── ProveedoresPage.tsx              # Router interno lista | form | detalle
│   ├── ProveedoresPage.module.scss
│   └── index.ts
├── features/proveedores/
│   ├── types.ts                         # View models (mock)
│   ├── mock/
│   │   ├── suppliers.mock.ts
│   │   └── catalog.mock.ts
│   ├── mappers/                         # display helpers (format COP, lead time)
│   ├── ProveedoresListView/
│   ├── ProveedorFormView/
│   ├── ProveedorDetailView/
│   │   ├── tabs/
│   │   │   ├── ProveedorInfoTab.tsx
│   │   │   ├── ProveedorCatalogTab.tsx
│   │   │   ├── ProveedorOcHistoryTab.tsx      # placeholder
│   │   │   ├── ProveedorQualityTab.tsx        # placeholder
│   │   │   └── ProveedorPayablesTab.tsx       # placeholder
│   │   └── ProveedorDetailView.tsx
│   └── hooks/
│       └── useProveedoresNavigation.ts  # estado vista: list | new | edit | detail
```

---

## Rutas (React Router)

Extender `App.tsx`:

```txt
/proveedores                    → lista + KPIs
/proveedores/nuevo              → formulario creación
/proveedores/:supplierId        → detalle (tab por query ?tab=info|catalog|...)
/proveedores/:supplierId/editar → formulario edición
```

Sincronizar tab activo con `useSearchParams` (`?tab=catalog`).

---

## Pantalla 1 — Lista

### Layout (según mockup)

1. `ProveedorPageHeader` — "SUPPLIER MANAGEMENT", "PROCUREMENT · RESTOPSIQ ENTERPRISE", acción "← INICIO" → `/`.
2. Fila de 4 `ProveedorMetricCard` (valores desde mock agregado).
3. `ProveedorListToolbar`:
   - **Búsqueda:** filtrar mock por `razonSocial`, `nit`, `contactoNombre`.
   - **Filtro estado:** `TODOS` | `ACTIVO` | `INACTIVO` | `PENDIENTE` (mock).
   - **Filtro condición de pago:** `TODAS` | `CONTADO` | `DIAS_15` | `DIAS_30` | `DIAS_60` (alineado a enum Prisma).
   - **Categoría:** opcional en UI; si se muestra, filtrar mock por campo derivado — documentar como cosmético hasta tener campo en API.
   - **EXPORTAR:** deshabilitado o toast "Próximamente".
   - **+ NUEVO PROVEEDOR** → `/proveedores/nuevo`.
4. `ProveedorSuppliersTable` — columnas por defecto (`defaultSupplierColumns`).
5. Click fila → `/proveedores/:id`.

### Mapeo fila lista → props `ProveedorTableRow`

| Columna UI     | Campo mock / futuro API                 |
| -------------- | --------------------------------------- |
| ID             | `displayCode` (ej. SUP-001)             |
| PROVEEDOR      | `razonSocial`                           |
| CATEGORÍA      | `categoryLabel` (mock)                  |
| ESTADO         | `status`: active \| inactive \| pending |
| CONDICIÓN PAGO | label humano de `condicionPago`         |
| LEAD TIME      | `leadTimeLabel` (mock, ej. "24h")       |
| CONFIABILIDAD  | `calificacion` formateada               |
| PRODUCTOS      | count catálogo mock                     |
| SALDO CXP      | mock COP                                |
| ÚLTIMA OC      | mock fecha                              |

---

## Pantalla 2 — Formulario crear / editar

### Campos (todos los del schema `Supplier`)

| Campo            | Tipo UI           | Validación                              |
| ---------------- | ----------------- | --------------------------------------- |
| `razonSocial`    | Input texto       | requerido                               |
| `nit`            | Input             | requerido                               |
| `dv`             | Input             | opcional                                |
| `tipo`           | Select            | `PERSONA_NATURAL` \| `PERSONA_JURIDICA` |
| `direccion`      | Input             | opcional                                |
| `ciudad`         | Input             | opcional                                |
| `telefono`       | Input             | opcional                                |
| `email`          | Input email       | opcional                                |
| `contactoNombre` | Input             | opcional                                |
| `condicionPago`  | Select            | enum `CondicionPago`                    |
| `cupoCredito`    | NumberInput       | entero ≥ 0                              |
| `calificacion`   | NumberInput       | 0–5, step 0.1                           |
| `isActive`       | Checkbox / toggle | solo en edición                         |

Organizar en `ProveedorFormSection`: "Información general", "Contacto", "Condiciones comerciales".

Acciones: `ProveedorFormActions` — Cancelar (volver) / Guardar (actualiza mock en memoria o `sessionStorage` para demo).

---

## Pantalla 3 — Detalle con tabs

### Header

`ProveedorDetailHeader`:

- Volver → lista.
- Nombre, `displayCode · NIT`, badge estado.
- **CONTACTAR** (`mailto:` si hay email).
- **EDITAR** → `/proveedores/:id/editar`.

### Tabs (`ProveedorDetailTabBar`)

| Tab ID     | Contenido tarea 1                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `info`     | `ProveedorContactPanel` + `ProveedorMetricsPanel` (email, tel, dirección, ciudad; confiabilidad, lead time, condición pago) |
| `catalog`  | `ProveedorCatalogTable` + botón "+ NUEVO PRODUCTO" abre `ProveedorProductModal` (mock)                                      |
| `history`  | `EmptyState` — "Historial de órdenes de compra — próximamente"                                                              |
| `quality`  | `EmptyState` — "Evaluaciones de calidad — próximamente"                                                                     |
| `payables` | `EmptyState` — "Cuentas por pagar — próximamente"                                                                           |

### Tab catálogo (mock)

Filas con: nombre insumo, SKU (`codigoInterno`), unidad, precio actual/anterior (trend up/down), MOQ mock, estado catálogo, acción Editar → modal.

Datos mock deben reflejar forma futura de `SupplierProduct` + `SupplyItem`:

```ts
interface SupplierCatalogRowMock {
  supplierProductId?: string;
  supplyItemId: string;
  productName: string;
  sku: string;
  precioUnitario: number;
  precioAnterior?: number;
  unidadCompra: StockUnit;
  factorConversion: number;
  tiempoEntregaDias: number;
  esProveedorPrincipal: boolean;
}
```

---

## Accesibilidad y UX

- Tablas con `role="table"` (ya en componentes Proveedor).
- Filtros con `aria-label` en español.
- Estados vacíos con `EmptyState`.
- Loading skeletons **no** requeridos en tarea 1 (sin async).

---

## Tests

| Archivo                        | Caso mínimo                                    |
| ------------------------------ | ---------------------------------------------- |
| `ProveedoresListView.test.tsx` | render tabla, filtro por estado reduce filas   |
| `ProveedorFormView.test.tsx`   | submit deshabilitado sin `razonSocial` / `nit` |
| `ProveedorDetailView.test.tsx` | cambio de tab muestra panel correcto           |

Patrón: `@testing-library/react`, sin React Query.

---

## Criterios de aceptación

- [x] `/proveedores` deja de ser placeholder.
- [x] Lista con filtros **estado** y **condición de pago** funcionando sobre mock.
- [x] Formulario creación/edición incluye **todos** los campos del modelo `Supplier`.
- [x] Detalle con **5 tabs**; 3 tabs con placeholder explícito.
- [x] Catálogo muestra precios con indicador de tendencia (mock).
- [x] Solo imports de UI desde `@restopsiq/ui` (+ lucide si ya usa el shell).
- [x] `npm run typecheck` y `npm run test` en `apps/web-app` pasan.

---

## Fuera de alcance

- React Query, GraphQL, persistencia real.
- Edición inline del catálogo (tarea 2).
- Export CSV.
- Backend / gateway changes.
