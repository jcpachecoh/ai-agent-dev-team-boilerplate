# REC-FORM-01 — Prisma schema: metadata receta + workflow

**Status:** `completed` (implemented with REC-FORM-10)  
**Migration:** `20260626140000_recipe_form_metadata`

## Cambios

### Enums nuevos

- `RecipeType`, `RecipeLifecycleStatus`, `OperationCenter`, `TechnicalResponsible`, `RecipeAllergen`, `BatchDisplayUnit`

### `RecipeCategory`

- `codePrefix` (único por tenant)
- `codeSequence` (consecutivo atómico)

### `ProductionRecipe`

- `code`, `recipeType`, `lifecycleStatus` (default `TRIAL`), `batchDisplayUnit`
- `packageWeightGrams` (nuevo; `packageWeight` kg legacy se mantiene)
- `expectedYield`, `expectedYieldUnit`, `operationCenter`, `technicalResponsible`, `allergens[]`
- `isDraft`, `rejectionReason`
- `finishedProductId` nullable (borradores)
- `@@unique([tenantId, code])`, `@@unique([tenantId, categoryId, name])`

### Tablas nuevas

- `production_recipe_locations` (M2M receta ↔ sede)
- `recipe_status_history`

### Backfill migración

- `isActive=true` → `lifecycleStatus=ACTIVE`
- `isActive=false` → `INACTIVE`
- Códigos legacy `COC-0001` según categoría o `LEG-0001`

## Aplicar localmente

```bash
pnpm exec prisma migrate deploy --schema=./apps/api/prisma/schema.prisma
pnpm exec prisma generate --schema=./apps/api/prisma/schema.prisma
```
