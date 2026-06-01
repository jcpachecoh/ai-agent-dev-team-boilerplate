# WEB-PROV-02 — Integración API Proveedores + catálogo inline (React Query)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PROVEEDORES]` `[GRAPHQL]` `[REACT-QUERY]` `[GATEWAY]`  
**Assigned Agent:** frontend-developer, backend-developer  
**Status:** `pending`  
**Depends On:** `01-ui-proveedores-module.md`  
**Schema:** `apps/api/prisma/schema.prisma` (líneas 50–203)  
**Gateway hoy:** `apps/gateway/src/schema/supplier/*`  
**Referencia integración:** `tasks/back-kds/01-integration-login.md` (patrón React Query en monorepo)

---

## Objetivo

Conectar el módulo de proveedores al backend usando **únicamente `@tanstack/react-query`** para estado servidor (queries + mutations). Reemplazar mocks por datos reales.

En el tab **Catálogo**, la tabla `supplier_products` debe ser **editable inline**: agregar filas y actualizar precios (y campos del vínculo) **sin modal** y sin abandonar la pantalla de detalle.

---

## Prerrequisitos backend (gateway / API)

Hoy el gateway solo expone CRUD de `Supplier`. Extender antes o en paralelo a la integración FE:

### GraphQL — Supplier (ya existe, ajustar filtros)

Ampliar `suppliers` query args:

```graphql
suppliers(
  filter: String
  isActive: Boolean
  condicionPago: CondicionPago
  limit: Int
  offset: Int
): [Supplier!]!
```

Implementar en `SupplierService.findAll`.

Opcional: campo calculado `productCount` vía `_count.products`.

### GraphQL — SupplierProduct (nuevo)

Tipos alineados a Prisma:

```prisma
model SupplierProduct {
  id                   String
  tenantId             String
  supplierId           String
  supplyItemId         String
  precioUnitario       Decimal
  unidadCompra         StockUnit
  factorConversion     Decimal
  tiempoEntregaDias    Int
  esProveedorPrincipal Boolean
  supplyItem           SupplyItem  // join para nombre, codigoInterno, unidadBase
}
```

Operaciones mínimas:

| Operación                                                                              | Uso FE                    |
| -------------------------------------------------------------------------------------- | ------------------------- |
| `supplierProducts(supplierId: ID!): [SupplierProduct!]!`                               | Tab catálogo              |
| `createSupplierProduct(input: CreateSupplierProductInput!): SupplierProduct!`          | Fila nueva inline         |
| `updateSupplierProduct(id: ID!, input: UpdateSupplierProductInput!): SupplierProduct!` | Guardar celda / fila      |
| `deleteSupplierProduct(id: ID!): Boolean!`                                             | Quitar vínculo (opcional) |

`CreateSupplierProductInput`: `supplierId`, `supplyItemId`, `precioUnitario`, `unidadCompra`, `factorConversion`, `tiempoEntregaDias`, `esProveedorPrincipal`.

Al actualizar `precioUnitario`, registrar entrada en `SupplyItemPriceHistory` (servicio en `apps/api` si la lógica vive fuera del gateway — documentar contrato).

### GraphQL — SupplyItem (lectura)

Query para combobox al agregar producto:

```graphql
supplyItems(search: String, limit: Int): [SupplyItem!]!
```

Solo lectura; scoped por `tenantId`.

### Tabs sin modelo aún

| Tab               | Tarea 2                                                |
| ----------------- | ------------------------------------------------------ |
| Historial OCs     | Mantener `EmptyState` hasta módulo compras             |
| Calidad           | Mantener `EmptyState`                                  |
| Cuentas por pagar | Mantener `EmptyState` o stub query si existe AP module |

---

## Setup `web-app`

### Dependencias

```bash
# en apps/web-app
pnpm add @tanstack/react-query graphql-request
```

### Provider

```txt
apps/web-app/src/
├── main.tsx                    # wrap QueryClientProvider
├── lib/
│   ├── query-client.ts         # retry, staleTime (patrón plant)
│   └── graphql-client.ts       # fetch autenticado al gateway
└── features/proveedores/
    ├── api/
    │   ├── proveedores.keys.ts
    │   ├── proveedores.queries.ts
    │   ├── proveedores.mutations.ts
    │   └── supplier-products.queries.ts
    └── hooks/
        ├── useSuppliers.ts
        ├── useSupplier.ts
        ├── useSupplierProducts.ts
        └── useSupplierProductMutations.ts
```

**Regla:** ningún `useEffect` + `fetch` manual para datos de proveedores; solo `useQuery` / `useMutation` / `useQueryClient`.

### Query keys

```ts
export const proveedoresKeys = {
  all: ['proveedores'] as const,
  lists: () => [...proveedoresKeys.all, 'list'] as const,
  list: (filters: SupplierListFilters) => [...proveedoresKeys.lists(), filters] as const,
  details: () => [...proveedoresKeys.all, 'detail'] as const,
  detail: (id: string) => [...proveedoresKeys.details(), id] as const,
  products: (supplierId: string) => [...proveedoresKeys.detail(supplierId), 'products'] as const,
};
```

Invalidar `list` tras create/update/delete supplier; invalidar `products(supplierId)` tras mutaciones de catálogo.

---

## Mapeo API ↔ UI

### Supplier → lista / formulario / detalle info

| Prisma / GraphQL                                             | UI                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| `id`                                                         | navegación; no mostrar cuid completo si hay `displayCode` |
| `razonSocial`                                                | nombre                                                    |
| `nit`, `dv`                                                  | identificación                                            |
| `tipo`                                                       | select form                                               |
| `direccion`, `ciudad`, `telefono`, `email`, `contactoNombre` | contacto                                                  |
| `condicionPago`                                              | filtro + label tabla                                      |
| `cupoCredito`                                                | form (COP)                                                |
| `calificacion`                                               | confiabilidad                                             |
| `isActive`                                                   | badge ACTIVO/INACTIVO                                     |

### SupplierProduct + SupplyItem → catálogo

| Prisma                                        | Columna UI                                                         |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `supplyItem.nombre`                           | PRODUCTO                                                           |
| `supplyItem.codigoInterno`                    | SKU                                                                |
| `unidadCompra`                                | UNIDAD (mapear `StockUnit` → label Kg, L, etc.)                    |
| `precioUnitario`                              | PRECIO ACTUAL (editable)                                           |
| último `SupplyItemPriceHistory.costoAnterior` | PRECIO ANTERIOR + trend                                            |
| `factorConversion` + `unidadCompra`           | MOQ display (ej. "5 kg") — o campo dedicado si se agrega al schema |
| `tiempoEntregaDias`                           | opcional columna o métrica                                         |
| `esProveedorPrincipal`                        | badge / icono                                                      |

---

## Catálogo editable inline

### Comportamiento

1. Tabla existente `ProveedorCatalogTable` evoluciona o se envuelve en `EditableSupplierProductsTable` en `web-app` (preferible no romper Storybook: props nuevas `editable`, `onSaveRow`).
2. **Fila nueva:** botón "+ NUEVO PRODUCTO" inserta fila al final en modo edición:
   - Combobox `supplyItem` (solo insumos no vinculados aún).
   - Celdas editables: precio, unidad compra, factor, lead time, principal (checkbox).
   - Acciones fila: **Guardar** / **Cancelar** (descarta fila draft).
3. **Fila existente:** click en precio (u "Editar") activa inputs inline; **Guardar** dispara `updateSupplierProduct`; **Esc** cancela.
4. **Sin modal** `ProveedorProductModal` en flujo integrado (mantener componente en UI kit para Storybook).

### Mutations (ejemplo)

```ts
const createProduct = useMutation({
  mutationFn: (input: CreateSupplierProductInput) =>
    graphqlClient.request(CREATE_SUPPLIER_PRODUCT, { input }),
  onSuccess: (_, vars) => {
    queryClient.invalidateQueries({ queryKey: proveedoresKeys.products(vars.supplierId) });
    toast.success('Producto agregado al catálogo');
  },
});
```

Optimistic update **opcional** solo en `precioUnitario` con rollback en `onError`.

### Validación

- `precioUnitario` > 0
- `supplyItemId` único por proveedor (error 409 → mensaje usuario)
- `factorConversion` > 0

---

## Hooks por pantalla

| Vista            | Hooks                                               |
| ---------------- | --------------------------------------------------- |
| Lista            | `useSuppliers({ search, isActive, condicionPago })` |
| Form create      | `useCreateSupplier()`                               |
| Form edit        | `useSupplier(id)` + `useUpdateSupplier()`           |
| Detalle info     | `useSupplier(id)`                                   |
| Detalle catálogo | `useSupplierProducts(supplierId)` + mutations       |

Estados UI: `isPending`, `isError`, `error` → `Alert` / `EmptyState` / skeleton de `@restopsiq/ui`.

---

## Autenticación

Reutilizar mecanismo de sesión que use `web-app` (cookie/JWT hacia gateway). El cliente GraphQL debe enviar headers de auth igual que el resto de la plataforma admin.

Si auth admin aún no está cableada en `web-app`, documentar bloqueo y usar variable `VITE_GRAPHQL_URL` + token dev en `.env.local` (no commitear).

---

## Tests

| Área                            | Enfoque                                                |
| ------------------------------- | ------------------------------------------------------ |
| Hooks                           | MSW o mock `graphql-request`; assert invalidateQueries |
| `EditableSupplierProductsTable` | agregar fila → guardar llama mutation                  |
| Integración ligera              | `QueryClientProvider` + `retry: false` en tests        |

Referencia: `tasks/testlab/08-fe-unit-tests.md`.

---

## Criterios de aceptación

- [ ] `@tanstack/react-query` configurado en `web-app` con una instancia global.
- [ ] Lista y CRUD de proveedores consumen gateway GraphQL real.
- [ ] Filtros lista: `isActive` + `condicionPago` server-side (o client-side sobre lista acotada si API temporal).
- [ ] Tab catálogo carga `supplier_products` del proveedor.
- [ ] Agregar y editar precios **inline** persiste vía API y refresca tabla sin navegar fuera.
- [ ] Cambio de precio genera historial (`SupplyItemPriceHistory`) cuando el backend lo implemente.
- [ ] No hay `fetch`/`axios` sueltos fuera de capa `api/` + React Query.
- [ ] `typecheck` + `test` verdes en `web-app` y tests gateway para nuevas operaciones.

---

## Fuera de alcance

- Módulos OC, calidad, CXP con datos reales.
- Categoría de proveedor en schema.
- Campos MOQ / estado Disponible-Limited en `SupplierProduct` (requiere migración Prisma separada).
- Export CSV.

---

## Orden de implementación sugerido

1. Gateway: filtros `suppliers` + schema `SupplierProduct` + `supplyItems` query.
2. FE: query-client + graphql-client + list/detail/form suppliers.
3. FE: catálogo query + tabla inline + mutations.
4. Price history en servicio API + test integración.
5. Quitar mocks y `sessionStorage` de tarea 01.
