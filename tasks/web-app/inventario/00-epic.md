# Epic: Inventario — integración Insumos (Web App ↔ API)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[INVENTARIO]` `[INSUMOS]` `[REST]` `[GRAPHQL]` `[REACT-QUERY]`  
**Status:** `completed`  
**Entry routes:** `/inventory`, `/inventory/products`, `/inventory/products/:id`, `/inventory/alerts`, `/inventory/reports`  
**UI kit:** `packages/ui/src/components/inventario/*` (exportados en `@restopsiq/ui`)  
**Schema:** `apps/api/prisma/schema.prisma` → `SupplyCategory`, `SupplyItem`, `SupplierProduct`, `SupplyItemPriceHistory` (líneas ~140–250)  
**API hoy:** `apps/api/src/supplyitems/*` (lectura parcial), `apps/api/src/supplier-product/*` (GraphQL catálogo proveedor)

---

## Objetivo de negocio (Insumos)

El maestro de **insumos** debe cubrir:

| Capacidad                   | Modelo Prisma                            | Notas                                                              |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| Catálogo de ítems           | `SupplyItem`                             | `nombre`, `codigoInterno`, unidad, CPP, flags lote/vencimiento     |
| Categorías                  | `SupplyCategory`                         | Clasificación en listado y formulario                              |
| Vínculo con proveedores     | `SupplierProduct`                        | Precio de compra, unidad, factor, lead time, proveedor principal   |
| Historial de costo/precio   | `SupplyItemPriceHistory`                 | Cambios de `costoPromedioPonderado` y contexto de recepción        |
| Límites de stock en maestro | `stockMinimoBodega`, `stockMaximoBodega` | Umbrales para alertas; stock físico es dominio aparte (bodega/MES) |

Este epic conecta esas capacidades con las pantallas de inventario ya construidas con mocks.

---

## Pantallas en alcance

| Ruta                      | Page → Screen                                                 | Rol en integración                                       |
| ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `/inventory`              | `InventoryDashboardPage` → `InventoryDashboardScreen`         | KPIs agregados desde insumos + (fase 2) movimientos      |
| `/inventory/products`     | `InventoryProductsPage` → `InventoryProductsScreen`           | **Maestro insumos** — listado, filtros, alta/edición     |
| `/inventory/products/:id` | `InventoryProductDetailPage` → `InventoryProductDetailScreen` | Detalle: CPP, límites, proveedores, historial de costo   |
| `/inventory/alerts`       | `InventoryAlertsPage` → `InventoryAlertsScreen`               | Alertas por `stockMinimo` vs stock disponible (derivado) |
| `/inventory/reports`      | `InventoryReportsPage` → `InventoryReportsScreen`             | Reportes por categoría / valor inventario (derivado)     |

**Fuera de este epic (referencia):** `/inventory/movements` — requiere módulo de movimientos de bodega aún no modelado en Prisma para insumos.

---

## Subtareas

| #   | Archivo                                                                      | Descripción                                                                                   | Depende de                                                 |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | [01-backend-prerequisites-insumos.md](./01-backend-prerequisites-insumos.md) | Completar API REST/GraphQL de categorías, insumos, proveedores por ítem, historial de precios | `tasks/supply-items-api/*`, `tasks/supply-items-catalog/*` |
| 2   | [02-maestro-insumos-products.md](./02-maestro-insumos-products.md)           | Integrar listado + CRUD + formulario con `SupplyItem` / `SupplyCategory`                      | Tarea 1                                                    |
| 3   | [03-detalle-proveedores-historial.md](./03-detalle-proveedores-historial.md) | Detalle: tab proveedores + timeline `SupplyItemPriceHistory`                                  | Tarea 1, Tarea 2                                           |
| 4   | [04-dashboard-alertas-reportes.md](./04-dashboard-alertas-reportes.md)       | Dashboard, alertas y reportes con datos reales o derivados                                    | Tarea 1, Tarea 2                                           |

---

## Estado actual

### Frontend (`apps/web-app`)

- Rutas y pantallas Inventario **implementadas** con componentes `@restopsiq/ui`.
- Cliente en `apps/web-app/src/api/inventory/`:
  - `fetchInventoryProducts` → `GET /api/supply-items` (lista **no existe** en controller).
  - CRUD → `POST/PATCH/DELETE /api/supply-items` (**no implementado**).
  - Dashboard, alertas, reportes, stock por sede, movimientos → rutas `/api/inventory/*` (**no existen** en API).
- Tipos UI (`InventoryProduct`) mezclan concepto **producto retail** (`sellingPrice`, `currentStock`) con insumos.
- Categorías y proveedores del formulario son **constantes mock** (`INVENTORY_CATEGORIES`, lista fija en `ProductFormModal`).
- Mock activo por defecto si `VITE_API_BASE_URL` no está definido (`useInventoryMock()`).

### Backend (`apps/api`)

| Recurso                                                 | Estado                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `GET /api/supply-items/:id`                             | Implementado (`SupplyItemsController`)                                           |
| `GET /api/supply-items` (lista)                         | **Falta** en controller (sí en GraphQL `supplyItems`)                            |
| CRUD categorías / insumos                               | Planificado en `tasks/supply-items-api/02-*` — **pendiente**                     |
| `GET /supply-items/:id/suppliers`                       | Planificado en `tasks/supply-items-api/03-*` — **pendiente**                     |
| Historial de precios                                    | Schema + tareas `04-price-history-*`, `06-cpp-*` — **pendiente** exposición REST |
| `SupplyCategory` API                                    | Sin módulo NestJS                                                                |
| `SupplierProduct`                                       | GraphQL vía `supplier-product` (flujo proveedor → insumo)                        |
| Endpoints `/inventory/dashboard`, `/alerts`, `/reports` | **No existen**                                                                   |

---

## Divergencias UI mock ↔ schema (resolver en subtareas)

| Campo / comportamiento UI | `InventoryProduct` (mock)             | `SupplyItem` (Prisma)                         | Decisión                                                           |
| ------------------------- | ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| SKU                       | `sku`                                 | `codigoInterno`                               | Mapear en DTO FE; validar unicidad por tenant                      |
| Nombre                    | `name`                                | `nombre`                                      | Mapear                                                             |
| Categoría                 | `category` + `categoryId` string mock | `categoriaId` → `SupplyCategory.nombre`       | Cargar categorías desde API                                        |
| Proveedor en tabla        | `supplier` string                     | `SupplierProduct.esProveedorPrincipal` + join | Mostrar `razonSocial` del principal; edición en detalle            |
| Costo                     | `costPrice`                           | `costoPromedioPonderado`                      | Solo lectura en listado si CPP lo actualiza recepciones            |
| Precio venta              | `sellingPrice`                        | **No existe** en insumos                      | **Quitar** del maestro insumos o ocultar (`itemType === 'supply'`) |
| Stock actual              | `currentStock`                        | **No en maestro**                             | Fase 2: agregado bodega; hasta entonces `0` o badge “sin stock”    |
| Mín / máx                 | `minStock`, `maxStock`                | `stockMinimoBodega`, `stockMaximoBodega`      | Mapear directo                                                     |
| Último movimiento         | `lastMovement`                        | N/A sin módulo movimientos                    | Ocultar o “—” hasta módulo bodega                                  |
| Tipo ítem                 | `itemType: product \| supply`         | Solo insumos en scope                         | Fijar `supply`; reservar `product` para futuro POS                 |

---

## Arquitectura objetivo (FE)

Seguir el patrón de `tasks/web-app/proveedores/02-api-integration-react-query.md`:

```
features/inventario/
  api/          — queries GraphQL + REST, keys React Query
  hooks/        — useSupplyItems, useSupplyCategories, mutations
  mappers/      — SupplyItem → InventoryProduct (vista)
  types.ts      — modelos alineados a API (no duplicar mock types)
```

Migrar `InventoryProductsScreen` y `InventoryProductDetailScreen` de `useState` + `useEffect` a **React Query**.

Mantener `apps/web-app/src/api/inventory/` como fachada delgada que delega a `features/inventario` (o reemplazar progresivamente).

---

## Criterio de éxito del epic

1. Con `VITE_USE_MOCK_INVENTORY=false` y API levantada, el usuario navega el módulo inventario sin mocks.
2. **Productos:** lista filtrable por categoría y búsqueda; crear/editar/desactivar insumo con categoría real y límites min/max.
3. **Detalle:** ve CPP, unidad base, flags; pestaña o panel de **proveedores vinculados**; **historial de costo** paginado.
4. **Alertas:** ítems bajo `stockMinimoBodega` (stock real cuando exista endpoint de bodega).
5. **Dashboard / reportes:** métricas mínimas derivadas del catálogo (conteo, valor = Σ CPP × stock si hay stock; si no, Σ CPP).
6. Errores de API visibles con `toast` del design system; invalidación de cache tras mutaciones.

---

## Referencias

- Schema insumos: `apps/api/prisma/schema.prisma` (sección INSUMOS)
- Tareas backend existentes: `tasks/supply-items-api/`, `tasks/supply-items-catalog/`
- Integración proveedores (reutilizar `supplyItems` GraphQL y `SupplierProduct`): `tasks/web-app/proveedores/`
- Cliente inventario actual: `apps/web-app/src/api/inventory/index.ts`
- Tests de rutas: `apps/web-app/src/App.inventory.test.tsx`
