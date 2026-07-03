# Epic: Gestión de Proveedores (Web App)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PROVEEDORES]` `[GRAPHQL]` `[REACT-QUERY]`  
**Status:** `pending`  
**Entry route:** `/proveedores` → `apps/web-app/src/pages/ProveedoresPage`  
**UI kit:** `packages/ui/src/components/proveedor/*` (exportados en `@restopsiq/ui`)  
**Schema:** `apps/api/prisma/schema.prisma` → `Supplier`, `SupplyItem`, `SupplierProduct`, `SupplyItemPriceHistory`  
**Gateway (hoy):** `apps/gateway/src/schema/supplier/*` — CRUD de `Supplier` únicamente

---

## Objetivo

Entregar el módulo de **administración de proveedores** en `web-app`: lista con filtros, alta/edición, detalle con pestañas y catálogo de insumos con precios editables inline, alineado a los mockups de referencia y al modelo Prisma.

## Subtareas

| #   | Archivo                                                                  | Descripción                                             | Depende de                                 |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------ |
| 1   | [01-ui-proveedores-module.md](./01-ui-proveedores-module.md)             | UI con `@restopsiq/ui`, datos mock, rutas y formularios | `tasks/web-app/01-layout-shell-sidebar.md` |
| 2   | [02-api-integration-react-query.md](./02-api-integration-react-query.md) | React Query + GraphQL/REST, catálogo inline, precios    | Tarea 1 + gateway extendido                |

## Referencias visuales

Capturas adjuntas al epic (mockups dark theme):

| Pantalla                                                            | Archivo en workspace                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Lista + KPIs + filtros                                              | `.cursor/projects/.../assets/image-ee6edc68-3b1f-4f52-8f19-a74bf214eb1f.png` |
| Detalle — tab Información                                           | `.../image-16b05475-0b95-43e7-b52d-b4b3a3ac01f7.png`                         |
| Detalle — tab Catálogo                                              | `.../image-ae713de1-f97a-47dd-830f-820e69ac329b.png`                         |
| Modal editar producto (referencia; sustituir por inline en tarea 2) | `.../image-6f6de175-ea77-4e1f-b7f2-bf7f1f035c2e.png`                         |

Copiar opcionalmente a `tasks/web-app/proveedores/design-references/` para versionado en repo.

## Estado actual

- `ProveedoresPage` es un `ModulePlaceholderPage`.
- Existe librería UI completa en Storybook (`Proveedor/*`).
- Gateway expone `suppliers`, `supplier`, `searchSuppliers`, `createSupplier`, `updateSupplier`, `deleteSupplier`.
- **No** hay GraphQL de `SupplierProduct` ni `SupplyItem` en gateway.
- `web-app` **no** tiene `@tanstack/react-query` ni cliente GraphQL aún.

## Divergencias mock ↔ schema (documentar en implementación)

| Mockup                                                  | Schema / API                                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID `SUP-001`                                            | `Supplier.id` (cuid) — mostrar código derivado o truncado en UI                                                                                                                        |
| Categoría del proveedor                                 | No existe en `Supplier` — omitir columna o derivar de insumos principales (fase 2)                                                                                                     |
| Estado `PENDIENTE`                                      | Solo `isActive` boolean — mapear: activo / inactivo; pendiente = futuro o `!isActive` + flag                                                                                           |
| Producto catálogo: SKU, MOQ, estado Disponible/Limitado | `SupplierProduct` + `SupplyItem.codigoInterno`; MOQ/estado catálogo **no** están en schema — usar `factorConversion`, `tiempoEntregaDias`, `esProveedorPrincipal` hasta ampliar schema |
| Saldo CXP, Última OC, KPIs agregados                    | Fuera de scope schema actual — mock en UI (tarea 1), wire real cuando existan módulos OC/AP                                                                                            |

## Criterio de éxito del epic

- Usuario navega `/proveedores` → lista filtrable → crear/editar proveedor → detalle con 5 tabs.
- Tab **Catálogo** permite agregar fila y editar precio/unidad/factor/lead time **sin salir** del detalle (tarea 2).
- Mutaciones invalidan cache React Query; errores visibles con toast/alert del design system.
