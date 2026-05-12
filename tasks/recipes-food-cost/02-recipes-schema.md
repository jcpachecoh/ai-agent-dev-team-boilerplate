# Task 02: Recipes and RecipeItem Schema

## Goal

Define the database models for Recipes and RecipeItems in the Prisma schema using domain-consistent field names.

## Requirements

- Add `StockUnit` enum (e.g., GRAMS, UNIT, ML).
- Add `Recipe` model:
  - `id`, `tenantId`, `productId`, `nombre`, `porciones`, `notas`, `isActive`, `foodCostActual` (Decimal).
- Add `RecipeItem` model:
  - `id`, `tenantId`, `recipeId`, `supplyItemId`, `cantidad` (Decimal), `unidad` (StockUnit), `notas`.
- Create minimal **placeholder** models for `Product` and `SupplyItem`:
  - Must include `id` and `tenantId`.
  - `SupplyItem` must include `costoPromedioPonderado` (Decimal).
  - Mark these as `// TODO: Move to dedicated module` and `// TEMPORARY PLACEHOLDER`.

## Acceptance Criteria

- `npx prisma generate` succeeds.
- Every model includes a `tenantId` field.
- Field names match the Spanish naming convention from the ticket (`nombre`, `porciones`, etc.).

## Files Likely Affected

- `apps/api/prisma/schema.prisma`

## Out of Scope

- Business logic or modules for Product/SupplyItem.
