# Task 06: Reactive Food Cost Recalculation

## Goal

Connect Supply Item cost updates to Recipe cost recalculations.

## Requirements

- Implement `recalculateRecipesUsingSupplyItem(tenantId: string, supplyItemId: string)` in `RecipeCostService`.
- Logic:
  1. Find all `RecipeItems` containing the `supplyItemId` within the tenant.
  2. Extract unique `recipeId`s.
  3. Trigger `recalculateRecipeFoodCost(tenantId, recipeId)` for each.
- Document this as a future integration point for the SupplyItem update flow.

## Acceptance Criteria

- Calling this method correctly updates `foodCostActual` for all affected recipes.
- Logic is tenant-safe.

## Files Likely Affected

- `apps/api/src/recipes/application/recipe-cost.service.ts`

## Out of Scope

- EventEmitter, BullMQ, or async infrastructure (unless a pattern already exists in the repo).
- Implementing the actual SupplyItem update flow.
