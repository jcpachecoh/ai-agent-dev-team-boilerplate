# Task: Backend — StockUnit BOX + stockActualBodega

## Goal

Close minimum backend gaps for the supply catalog epic: support **box** unit and **current warehouse stock** on `SupplyItem`.

## Scope

### Prisma

1. Extend enum `StockUnit` with value **`BOX`**.
2. Add to `SupplyItem`:
   ```prisma
   stockActualBodega Decimal @default(0)
   ```
3. Create migration SQL:
   - `ALTER TYPE "StockUnit" ADD VALUE IF NOT EXISTS 'BOX';` (o equivalente según versión Postgres del proyecto)
   - `ALTER TABLE "supply_items" ADD COLUMN "stockActualBodega" DECIMAL(65,30) NOT NULL DEFAULT 0;`

### Repository (`supplyitems.repository.ts`)

- `create`: persist `stockActualBodega` from data or default `0`.
- `update`: patch when provided in `UpdateSupplyItemData`.
- `findAll` / `findOneDetailed`: column included by default (no select omit).

### Interfaces (`supplyitems.interfaces.ts`)

- `CreateSupplyItemData`: optional `stockActualBodega?: string`
- `UpdateSupplyItemData`: optional `stockActualBodega?: string`

### Service (`supplyitems.service.ts`)

- `assertNonNegativeStockActual(value: string)` — reject `< 0` with `BadRequestException`.
- Call on create (if provided) and update (if provided).
- Do **not** add cross-validation stockActual vs min/max in this task.

### DTOs

| File                          | Change                                                                   |
| ----------------------------- | ------------------------------------------------------------------------ |
| `create-supply-item.dto.ts`   | Optional `stockActualBodega?: string` (`@IsNumberString`, `@IsOptional`) |
| `update-supply-item.dto.ts`   | Optional `stockActualBodega?: string`                                    |
| `supply-item-response.dto.ts` | `stockActualBodega!: number`                                             |

### Mapper (`supply-item.mapper.ts`)

- Map `stockActualBodega` with `decimalToNumber`.

### GraphQL (`supplyitems.resolver.ts`)

- `SupplyItemType`: `@Field(() => Float) stockActualBodega`
- `CreateSupplyItemInput` / `UpdateSupplyItemInput`: optional string field (mismo patrón que otros Decimal)
- `mapSupplyItemToGql`: incluir campo

### Validation util

- `apps/api/src/utils/validation.ts`: `StockUnitSchema` → añadir `'BOX'`.

### Inventory (read path only)

- `apps/api/src/inventory/service/inventory.service.ts`:
  - `getDashboard`: `stock` desde `item.stockActualBodega` (no literal `0`).
  - `getAlerts`: `currentStock` desde `item.stockActualBodega`.
  - `getReport` valuation: si usa `cpp * stock`, usar stock actual real.

### Seed (opcional pero recomendado)

- `apps/api/prisma/seed.ts`:
  - Upsert categorías canónicas para `palos-de-lena`: Cárnicos, Lácteos, Granos, Bebidas, Aseo, Empaque (ids CUID fijos documentados en comentario seed).
  - Mantener ítems seed existentes; setear `stockActualBodega` explícito en 1–2 fixtures (ej. arroz > min para no disparar alerta falsa).
  - Opcional: un `SupplierProduct` o ítem demo con `unidadBase: BOX` / `unidadCompra: BOX`.

### Docs

- `specs/supply-items-api.md`: documentar `stockActualBodega` y `BOX`.
- `specs/suppliers-catalog.md`: actualizar lista `StockUnit`.

## Out of Scope

- `apps/web-app/**`
- Menu products, recipes BOM, purchase reception, CPP recalculation
- Warehouse movements table / triggers
- Renaming `stockMinimoBodega` / `stockMaximoBodega`
- Cambios en `apps/api/src/mes/plant/**` (enum se propaga; no feature work MES)
- `package.json`, `pnpm-lock.yaml`, `app.module.ts` (sin cambios de wiring esperados)

## Files Allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/<timestamp>_supply_item_box_stock_actual/`
- `apps/api/prisma/seed.ts`
- `apps/api/src/supplyitems/**`
- `apps/api/src/utils/validation.ts`
- `apps/api/src/inventory/service/inventory.service.ts`
- `specs/supply-items-api.md`
- `specs/suppliers-catalog.md`

## Files Forbidden

- `apps/web-app/**`
- `apps/api/src/auth/**`
- `apps/api/src/app.module.ts`
- `package.json`, `pnpm-lock.yaml`
- `apps/api/src/mes/**` (unless compile break — fix minimal test fixture only with approval)

## Acceptance Criteria

- [x] `npx prisma format` && `npx prisma validate` pass in `apps/api`
- [x] Migration SQL created (`20260604120000_supply_item_box_stock_actual`)
- [x] `POST /api/supply-items` accepts `unidadBase: "BOX"` and optional `stockActualBodega`
- [x] Omitting `stockActualBodega` on create returns `0` in GET
- [x] `PATCH` can update `stockActualBodega`; negative value → 400
- [x] GraphQL `createSupplyItem` / `supplyItems` expose `stockActualBodega` and `BOX`
- [x] `InventoryService` alerts use persisted stock (not hardcoded zero)
- [x] `SupplierProduct` con `unidadCompra: BOX` válido (Zod + Prisma enum)

## Validation Commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma migrate dev --name supply_item_box_stock_actual
npx prisma generate
pnpm test supplyitems
pnpm test inventory.service.spec
```

## Implementation Notes

- Tras `prisma generate`, `@IsEnum(StockUnit)` en DTOs reconoce `BOX` sin lista manual.
- GraphQL enum se regenera desde `registerEnumType(StockUnit)` — verificar introspección si hay schema.gql committed.
- Índice en `stockActualBodega` **no** requerido en MVP.
