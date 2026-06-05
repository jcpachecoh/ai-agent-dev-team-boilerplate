# Analysis: Catálogo de Insumos — cierre mínimo backend

**Epic:** Catálogo de Insumos y Materias Primas  
**Track:** `tasks/supply-items-catalog/00–02` (cierre gaps; distinto de tareas 01–05 históricas del mismo folder)  
**Status:** Analysis only — **no implementación**  
**Date:** 2026-06-04

---

## Objetivo del cierre

Cerrar solo dos gaps backend del maestro `SupplyItem` (implementación de **Insumo**):

1. Unidad **caja** en `StockUnit`.
2. Campo **`stockActualBodega`** (stock actual en bodega, MVP almacenado).

Sin menú/recetas, sin movimientos de inventario, sin CPP automático, sin frontend.

---

## Estado actual del backend (verificación)

| Requisito épica                              | Implementación actual                                      | Gap                                        |
| -------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Entidad Insumo separada de producto menú     | `SupplyItem` / `supply_items`; no existe `MenuProduct`     | Ninguno para este track                    |
| `nombre`, `codigoInterno`, `isActive`        | Presentes                                                  | —                                          |
| Categoría                                    | `categoriaId` → `SupplyCategory` (flexible por tenant)     | Ninguno (épica enum fijo **no** se adopta) |
| `unidadBase`                                 | `StockUnit` enum Prisma                                    | Falta valor **caja**                       |
| `factorConversion`, `costoPromedioPonderado` | `Decimal` en schema + API                                  | —                                          |
| `stockMinimo` / `stockMaximo`                | `stockMinimoBodega` / `stockMaximoBodega`                  | Solo naming; validados en service          |
| `aplicaVencimiento`                          | Presente                                                   | —                                          |
| N:M proveedores                              | `SupplierProduct` / `supplier_products`                    | —                                          |
| Stock actual                                 | No existe; `InventoryService` usa `const currentStock = 0` | **Gap principal**                          |
| Receta menú → insumos                        | `ProductionRecipe` / `PhaseInput` (MES); sin producto menú | **Fuera de scope**                         |

---

## Hallazgos por área analizada

### 1. `StockUnit` — definición y uso

| Ubicación                                                             | Uso                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                       | Enum fuente: `UNIT`, `GRAMS`, `KILOGRAMS`, `ML`, `LITERS` |
| `SupplyItem.unidadBase`                                               | Unidad base del insumo                                    |
| `SupplierProduct.unidadCompra`                                        | Unidad en que compra el proveedor                         |
| `ProductionRecipe.batchUnit`, `PhaseInput.unit`                       | MES / planta                                              |
| `apps/api/src/utils/validation.ts`                                    | `StockUnitSchema` Zod duplicado (supplier-product)        |
| `apps/api/src/supplyitems/dto/*.ts`                                   | `@IsEnum(StockUnit)` REST                                 |
| `apps/api/src/supplyitems/resolver/supplyitems.resolver.ts`           | `registerEnumType(StockUnit)` GraphQL                     |
| `apps/api/src/supplier-product/resolver/supplier-product.resolver.ts` | GraphQL inputs                                            |
| `postman/restopsiq-api.collection.json`                               | Ej. `"unidadBase": "LITERS"`                              |

**Convención:** valores del enum en **inglés** (SCREAMING_SNAKE), alineados con Prisma/GraphQL/Swagger.

### 2. Decisión `BOX` vs `CAJA`

| Opción    | Veredicto                                                                            |
| --------- | ------------------------------------------------------------------------------------ |
| `CAJA`    | Rechazado — rompe convención existente (`KILOGRAMS`, `LITERS`, no español)           |
| **`BOX`** | **Adoptar** — equivalente semántico a “caja”; consistente con `UNIT` (unidad suelta) |

Migración Postgres: `ALTER TYPE "StockUnit" ADD VALUE 'BOX';` (aditivo, sin rewrite de filas).

### 3. DTOs / validadores `SupplyItem.unidadBase`

- Create/Update REST: `class-validator` `@IsEnum(StockUnit)` — se actualiza automáticamente tras `prisma generate`.
- Interfaces: `CreateSupplyItemData` / `UpdateSupplyItemData` en `supplyitems.interfaces.ts`.
- No hay Zod en supply-items service; supplier-product sí usa `StockUnitSchema` en `validation.ts` (**debe incluir `BOX`**).

### 4. `SupplierProduct.unidadCompra`

- Mismo enum `StockUnit`; un proveedor podrá registrar compra por **BOX** tras la migración.
- Sin cambio de modelo salvo enum; tests de `supplier-product` con `BOX` opcional en Task 02.

### 5. GraphQL

- `registerEnumType(StockUnit, { name: 'StockUnit' })` en `supplyitems.resolver.ts`.
- Tras regenerar cliente Prisma, el schema GraphQL expone el nuevo valor sin código extra salvo tests/fixtures.

### 6. REST response mapping

- `supply-item.mapper.ts` → `toSupplyItemResponse` / `SupplyItemResponseDto`.
- Resolver helper `mapSupplyItemToGql` duplica campos numéricos vía `decimalToNumber`.
- **Ambos** deben mapear `stockActualBodega`.

### 7. Postman

- Folder supply-items: body create usa `LITERS`; añadir ejemplo o variable con `BOX` y campo `stockActualBodega` en create/patch.
- `postman/README.md`: nota breve sobre `StockUnit` y stock actual.

### 8. Seed — categorías épica

Épica sugiere: Cárnicos, Lácteos, Granos, Bebidas, Aseo, Empaque.

**Hoy:** seed solo `Abarrotes` + `Granos` (`SEED_CATEGORY_ID`, `SEED_CATEGORY_GRANOS_ID`).

**Decisión:** mantener `SupplyCategory` flexible; **recomendado** ampliar seed del tenant `palos-de-lena` con las 6 categorías canónicas (ids determinísticos) para demos/Postman — **no bloqueante** para schema `BOX` / `stockActualBodega`. No convertir a enum.

### 9. `stockMinimoBodega` / `stockMaximoBodega`

| Capa       | Comportamiento                                    |
| ---------- | ------------------------------------------------- |
| Schema     | `Decimal` NOT NULL                                |
| Create DTO | Requeridos (`@IsNumberString`)                    |
| Service    | `assertStockRange(min, max)` — min ≤ max          |
| Inventory  | Lee umbral; stock comparado hoy hardcodeado a `0` |

### 10–12. `stockActualBodega` — diseño MVP

| Aspecto             | Decisión                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Nombre              | `stockActualBodega` (paridad con `stockMinimoBodega` / `stockMaximoBodega`)                                               |
| Tipo                | `Decimal` NOT NULL `@default(0)`                                                                                          |
| Create REST/GraphQL | **Opcional**; si omitido → `0`                                                                                            |
| Update REST/GraphQL | **Opcional**; permite ajuste manual / saldo inicial hasta existan movimientos                                             |
| Validación          | `>= 0`; no exigir relación con min/max en este track                                                                      |
| Futuro              | Movimientos de bodega pueden **recalcular** o reemplazar como fuente de verdad; PATCH directo podría restringirse después |
| `InventoryService`  | Sustituir `currentStock = 0` por `decimalToNumber(item.stockActualBodega)` en dashboard/alerts                            |

**Por qué writable (no solo read-only):** sin módulo de movimientos, un campo solo-lectura dejaría todo en 0 y no cerraría el gap de “saber cuánto hay”; ajuste manual es el puente MVP documentado.

### 13. Tests necesarios (resumen → Task 02)

- Schema/migration: validación Prisma CLI.
- Repository create/update con default y valor explícito.
- Service: validación negativa de stock actual.
- Controller/resolver: respuesta incluye campo; `BOX` en create.
- Mapper spec.
- `inventory.service.spec.ts`: alertas con stock bajo umbral cuando `stockActualBodega` < min.
- Supplier-product: `BOX` en `unidadCompra` (smoke).

---

## Decisiones registradas (obligatorias)

1. **`SupplyItem`** es el nombre de implementación de Insumo (`@@map("supply_items")`).
2. **`SupplyCategory`** permanece flexible (sin enum fijo de categorías).
3. Añadir **`BOX`** a `StockUnit` (inglés, consistente con enum existente).
4. Añadir **`stockActualBodega`** en `SupplyItem` como stock actual MVP.
5. `stockActualBodega` **`Decimal @default(0)`**.
6. **Writable** en create/update (opcional); default 0.
7. Movimientos de inventario **fuera de scope**; campo preparado para ser actualizado por dominio futuro.
8. **MenuProduct / receta menú** fuera de scope.
9. **CPP automático** fuera de scope.
10. **Frontend** (`apps/web-app/**`) explícitamente fuera de scope.

---

## Tareas de implementación recomendadas

| #   | Archivo                                   | Contenido                                             |
| --- | ----------------------------------------- | ----------------------------------------------------- |
| 1   | `01-backend-stockunit-box-stockactual.md` | Schema, migración, API, seed opcional, inventory read |
| 2   | `02-backend-tests-postman-validation.md`  | Tests, Postman, specs/README backend                  |

---

## Fuera de scope (este track)

- `apps/web-app/**`
- `MenuProduct`, BOM receta menú, `finishedProductId` FK
- Movimientos de bodega, lotes, vencimientos operativos
- CPP / `SupplyItemPriceHistory` escritura automática
- Auth, RBAC, permisos nuevos
- Renombrar `stockMinimoBodega` → `stockMinimo` (breaking sin valor)

---

## Archivos de implementación previstos (referencia Task 01)

**Allowed (Task 01):**

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/*` (nueva migración)
- `apps/api/prisma/seed.ts`
- `apps/api/src/supplyitems/**`
- `apps/api/src/utils/validation.ts`
- `apps/api/src/inventory/service/inventory.service.ts`
- `apps/api/src/inventory/test/inventory.service.spec.ts`
- `specs/supply-items-api.md`
- `specs/suppliers-catalog.md` (tabla StockUnit)

**Forbidden:**

- `apps/web-app/**`
- `apps/api/src/auth/**`
- `apps/api/src/mes/**` (salvo tests rotos por enum — evitar cambios MES salvo necesidad)
- `package.json`, `pnpm-lock.yaml` (regla SDD global salvo tarea explícita)
