# INV-BE-01 — Prerrequisitos API: categorías, insumos, proveedores, historial

**Domain:** `[BACKEND]` `[API]` `[INSUMOS]`  
**Assigned Agent:** backend-developer  
**Status:** `completed`  
**Depends On:** `tasks/supply-items-api/*`, `tasks/supply-items-catalog/*`  
**Blocks:** `02-maestro-insumos-products.md`, `03-detalle-proveedores-historial.md`, `04-dashboard-alertas-reportes.md`

---

## Objetivo

Exponer en `apps/api` el contrato que el módulo Inventario necesita, alineado al schema Prisma de insumos. Hoy el FE asume endpoints que no existen o devuelven shape distinto al mock.

---

## Estado vs. necesidad del FE

| Necesidad FE              | Endpoint / operación sugerida                                         | Estado API                                    |
| ------------------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| Listar insumos            | `GET /api/supply-items?search=&categoriaId=&isActive=&limit=&offset=` | Solo GraphQL `supplyItems(search, limit)`     |
| Detalle insumo            | `GET /api/supply-items/:id`                                           | OK                                            |
| Crear insumo              | `POST /api/supply-items`                                              | Pendiente (`supply-items-api/02`)             |
| Actualizar insumo         | `PATCH /api/supply-items/:id`                                         | Pendiente                                     |
| Desactivar                | `PATCH` con `isActive: false` o `DELETE` soft                         | Pendiente                                     |
| Categorías CRUD / listado | `GET /api/supply-categories` (+ POST/PATCH)                           | Sin módulo                                    |
| Proveedores del ítem      | `GET /api/supply-items/:id/suppliers`                                 | Pendiente (`supply-items-api/03`)             |
| Historial de costo        | `GET /api/supply-items/:id/price-history?limit=&offset=`              | Pendiente (`supply-items-api/04`)             |
| Validar SKU único         | `GET /api/supply-items?codigoInterno=` o header en POST 409           | Pendiente                                     |
| Dashboard inventario      | `GET /api/inventory/dashboard`                                        | No existe                                     |
| Alertas stock bajo        | `GET /api/inventory/alerts`                                           | No existe (derivar de insumos + stock futuro) |
| Reportes                  | `GET /api/inventory/reports?type=&from=&to=`                          | No existe                                     |

---

## Requerimientos — Supply Items (REST)

Implementar o completar según `tasks/supply-items-api/02-supply-items-crud-api.md`:

- [ ] `GET /api/supply-items` — lista tenant-scoped con:
  - `search` (nombre o codigoInterno)
  - `categoriaId`, `isActive`
  - `include=categoria` (nombre categoría para tabla)
  - paginación `limit` / `offset`
- [ ] `POST /api/supply-items` — body DTO:
  - `nombre`, `codigoInterno`, `categoriaId`, `descripcion?`
  - `unidadBase`, `factorConversion`
  - `stockMinimoBodega`, `stockMaximoBodega`
  - `aplicaVencimiento`, `aplicaLote`, `isActive`
  - **No** aceptar `tenantId` en body
  - `costoPromedioPonderado` inicial `0` o valor explícito documentado
- [ ] `PATCH /api/supply-items/:id` — mismos campos parciales
- [ ] Respuesta JSON: serializar `Decimal` como string o number (documentar convención; FE ya usa `number` en mocks)

### Shape de respuesta recomendado (lista/detalle)

```json
{
  "id": "cuid",
  "nombre": "Arroz premium",
  "codigoInterno": "INS-001",
  "categoriaId": "cuid",
  "categoria": { "id": "...", "nombre": "Granos" },
  "unidadBase": "KILOGRAMS",
  "factorConversion": "1",
  "costoPromedioPonderado": "4500.00",
  "stockMinimoBodega": "10",
  "stockMaximoBodega": "500",
  "aplicaVencimiento": false,
  "aplicaLote": false,
  "isActive": true,
  "proveedorPrincipal": { "supplierId": "...", "razonSocial": "Agrosuper" },
  "stockDisponible": null
}
```

`proveedorPrincipal` y `stockDisponible` opcionales en v1 (join + placeholder).

---

## Requerimientos — Supply Categories (REST)

Nuevo módulo `apps/api/src/supply-categories/` (o bajo `supplyitems`):

- [ ] `GET /api/supply-categories?isActive=true`
- [ ] `POST /api/supply-categories` — `nombre`, `descripcion?`
- [ ] `PATCH /api/supply-categories/:id`
- [ ] Unicidad `@@unique([tenantId, nombre])` → `409 Conflict`

---

## Requerimientos — Proveedores por insumo

Según `tasks/supply-items-api/03-supply-item-suppliers-endpoint.md`:

- [ ] `GET /api/supply-items/:id/suppliers`
- [ ] Campos: `supplierId`, `razonSocial`, `nit`, `precioUnitario`, `unidadCompra`, `factorConversion`, `tiempoEntregaDias`, `esProveedorPrincipal`
- [ ] `404` si el insumo no existe en el tenant

---

## Requerimientos — Historial de precios

Según `tasks/supply-items-api/04-price-history-schema.md` y servicio CPP:

- [ ] `GET /api/supply-items/:id/price-history` ordenado `createdAt desc`
- [ ] Campos: `costoAnterior`, `costoNuevo`, `cantidadRecibida`, `stockAnterior`, `stockNuevo`, `motivo`, `referenciaTipo`, `referenciaId`, `createdAt`
- [ ] Escritura del historial al actualizar CPP vía `SupplierProduct` / recepciones (ya parcial en `supplier-product.repository`)

---

## Requerimientos — Agregados inventario (v1 mínima)

Nuevo controller `apps/api/src/inventory/` o queries en `supplyitems`:

### `GET /api/inventory/dashboard`

Calcular sin movimientos si aún no hay stock:

- `totalItems`: count `SupplyItem` activos
- `totalValue`: suma `costoPromedioPonderado` (o × stock cuando exista)
- `lowStockCount`: ítems donde `stockDisponible < stockMinimoBodega` o, sin stock, ítems con `stockMinimoBodega > 0` como proxy
- `movementsToday`: `0` hasta módulo movimientos
- `topProducts` / `stockBySite` / `historyOccupancy`: arrays vacíos o datos seed documentados

### `GET /api/inventory/alerts`

- Generar alertas por ítem: `currentStock`, `threshold` (= `stockMinimoBodega`), `severity` (critical si stock ≤ 50% min, warning si < min)
- `supplier`: razonSocial proveedor principal
- `isResolved`: persistencia opcional v1 — puede ser solo cálculo en memoria; si se necesita resolver, tabla futura o flag en sesión

### `GET /api/inventory/reports?type=category|valuation&from=&to=`

- `type=category`: agrupar por `SupplyCategory.nombre`, cantidad ítems, % del total
- `type=valuation`: valor por categoría usando CPP
- `from`/`to`: filtrar historial si `type` lo requiere; si no hay movimientos, ignorar fechas con aviso en Swagger

---

## GraphQL (paridad opcional)

Ampliar `SupplyItemType` en `supplyitems.resolver.ts` para incluir campos del maestro (categoría, CPP, stocks min/max) si el FE prefiere GraphQL en detalle; el listado de inventario puede seguir REST por consistencia con `inventoryFetch`.

Proveedores: reutilizar mutaciones existentes de `supplier-product` para **crear vínculo desde detalle insumo** (invertir flujo: hoy es desde proveedor).

---

## Permisos y auth

- [ ] Endpoints protegidos con JWT + `x-tenant-id` (igual que `SupplyItemsController`)
- [ ] Códigos RBAC sugeridos: `supply.items.read`, `supply.items.manage`, `supply.categories.manage` (verificar en `permissions` seed)

---

## Criterios de aceptación

- [ ] Postman/collection o Swagger documenta todos los endpoints anteriores
- [ ] Tests unitarios repository/service para CRUD y suppliers endpoint
- [ ] `pnpm --filter api test` pasa en módulos tocados
- [ ] Seed (`apps/api/prisma/seed.ts`) deja al menos 3 insumos, 2 categorías y vínculos `SupplierProduct` para prueba manual del FE

---

## Comandos de validación

```bash
cd apps/api
npx prisma validate
pnpm test supplyitems
pnpm test supply-categories   # cuando exista
```
