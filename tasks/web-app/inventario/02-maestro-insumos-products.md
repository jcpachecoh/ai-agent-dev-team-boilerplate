# INV-FE-02 — Maestro de insumos: Products list + CRUD

**Domain:** `[FRONTEND]` `[WEB-APP]` `[INVENTARIO]` `[REST]` `[REACT-QUERY]`  
**Assigned Agent:** frontend-developer  
**Status:** `completed`  
**Depends On:** `01-backend-prerequisites-insumos.md`  
**Pages:** `InventoryProductsPage` → `InventoryProductsScreen`  
**Files clave:** `apps/web-app/src/api/inventory/*`, `ProductFormModal`, `types/inventory.ts`

---

## Objetivo

Reemplazar mocks y constantes hardcodeadas en el listado de productos/insumos por datos reales de `SupplyItem` y `SupplyCategory`, manteniendo la UI actual de `@restopsiq/ui`.

---

## Prerrequisitos

- [ ] `GET/POST/PATCH /api/supply-items` operativos
- [ ] `GET /api/supply-categories` operativo
- [ ] `VITE_API_BASE_URL` y `VITE_TENANT_ID` configurados; `VITE_USE_MOCK_INVENTORY=false` para QA

---

## Tareas

### 1. Capa de datos (`features/inventario`)

- [ ] Crear `features/inventario/types.ts` con tipos API (`SupplyItemApi`, `SupplyCategoryApi`, `StockUnit`)
- [ ] Crear `features/inventario/mappers/toInventoryProduct.ts`:
  - `codigoInterno` → `sku`
  - `nombre` → `name`
  - `categoria.nombre` → `category`; `categoriaId` → `categoryId`
  - `costoPromedioPonderado` → `costPrice`
  - `stockMinimoBodega` / `stockMaximoBodega` → `minStock` / `maxStock`
  - `proveedorPrincipal.razonSocial` → `supplier` (fallback `"—"`)
  - `itemType: 'supply'` fijo
  - `currentStock`: `stockDisponible ?? 0`
  - `sellingPrice`: omitir en UI o `0` (no mostrar columna margen en listado)
  - `lastMovement`: `"—"` o ocultar columna
- [ ] React Query keys: `inventarioKeys.all`, `items`, `categories`
- [ ] Hooks: `useSupplyItems(filters)`, `useSupplyCategories()`, `useCreateSupplyItem`, `useUpdateSupplyItem`, `useDeactivateSupplyItem`

### 2. Refactor `InventoryProductsScreen`

- [ ] Sustituir `useState` + `load()` por `useSupplyItems` con `isLoading` / `isError` / `refetch`
- [ ] Filtros:
  - `search` → query param API o filtro cliente si API sin paginación v1
  - `categoryId` → opciones desde `useSupplyCategories` (reemplazar `INVENTORY_CATEGORIES`)
  - `supplierId` → filtrar por `proveedorPrincipal.supplierId` cuando API lo incluya; si no, deshabilitar filtro proveedor hasta tarea 3
  - `lowStockOnly` → `currentStock < minStock` en mapper
- [ ] Paginación: mantener cliente (`INVENTORY_PAGE_SIZE`) o server-side si API expone `offset`
- [ ] Mutaciones con toast + invalidación `inventarioKeys.items`

### 3. `ProductFormModal`

- [ ] Select categoría: opciones desde API (`id` + `nombre`)
- [ ] **Eliminar** campo precio de venta (`sellingPrice`) del formulario de insumos
- [ ] **Eliminar** select proveedor del alta — el vínculo se gestiona en detalle (tarea 03) o mensaje “Asigne proveedor en el detalle”
- [ ] Campos alineados al DTO POST/PATCH:
  - `codigoInterno`, `nombre`, `categoriaId`
  - `unidadBase` (select: UNIT, GRAMS, KILOGRAMS, ML, LITERS)
  - `factorConversion` (default 1)
  - `stockMinimoBodega`, `stockMaximoBodega`
  - toggles `aplicaVencimiento`, `aplicaLote`
- [ ] Validación SKU: usar `409` del API o query dedicada en lugar de cargar lista completa (`checkSkuExists`)
- [ ] Actualizar `mapFormToApi` en `api/inventory/index.ts` con campos completos

### 4. Tabla (`InventarioTableRow`)

- [ ] Revisar columnas vs. insumos: quitar margen/venta si no aplica
- [ ] `stockToneForProduct` en `utils/inventory.ts`: usar `minStock`/`maxStock` del maestro
- [ ] Navegación `onSkuClick` → `/inventory/products/:id` (id Prisma)

### 5. Deprecación mock

- [ ] Mantener `inventoryMockStore` detrás de `useInventoryMock()` para Storybook/tests
- [ ] Actualizar `App.inventory.test.tsx` con MSW o mock fetch si prueban integración

---

## Criterios de aceptación

- [ ] Crear insumo desde UI persiste en DB y aparece en listado tras refetch
- [ ] Editar límites min/max se refleja en badge de stock de la tabla
- [ ] Desactivar insumo lo oculta del listado default (`isActive=true`)
- [ ] Sin `VITE_USE_MOCK_INVENTORY`, no se importa seed mock en runtime
- [ ] Errores 409 (SKU duplicado) y 404 muestran mensaje en español

---

## Archivos probables

| Acción    | Ruta                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------ |
| Crear     | `apps/web-app/src/features/inventario/**`                                                        |
| Modificar | `apps/web-app/src/screens/InventoryProductsScreen/InventoryProductsScreen.tsx`                   |
| Modificar | `apps/web-app/src/components/inventory/ProductFormModal.tsx`                                     |
| Modificar | `apps/web-app/src/api/inventory/index.ts`                                                        |
| Modificar | `apps/web-app/src/types/inventory.ts` (marcar campos legacy o separar `InventorySupplyItemView`) |
| Modificar | `apps/web-app/src/utils/inventory.ts`                                                            |

---

## Fuera de alcance

- Panel proveedores e historial (tarea 03)
- Movimientos de stock y ajustes en detalle (requiere API bodega)
