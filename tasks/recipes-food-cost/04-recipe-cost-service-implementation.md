# Task 04: RecipeCostService Implementation

## Goal

Implement the business logic for food cost calculation with strict tenant scoping.

## Requirements

- Create `RecipeCostService` in `apps/api/src/recipes/application/`.
- Implement `calculateRecipeFoodCost(tenantId: string, recipeId: string)`:
  - Fetch recipe and items ensuring `tenantId` match.
  - Use `Decimal.js` for all arithmetic. **No float/number arithmetic allowed.**
- Implement `recalculateRecipeFoodCost(tenantId: string, recipeId: string)`:
  - Perform calculation and update `foodCostActual` in the database.
- **Strict Rule:** Every data access operation must be scoped by `tenantId`.

## Acceptance Criteria

- All tests from Task 03 pass.
- No precision errors found in calculation.

## Files Likely Affected

- `apps/api/src/recipes/application/recipe-cost.service.ts`

## Out of Scope

- API Controller.
- Reactive recalculation triggers.
