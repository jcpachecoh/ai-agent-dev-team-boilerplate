# Task 03: RecipeCostService Tests

## Goal

Create failing unit tests for the `RecipeCostService` logic, ensuring strict tenant enforcement and Decimal arithmetic.

## Requirements

- Create `apps/api/src/recipes/application/recipe-cost.service.spec.ts`.
- Define signatures:
  - `calculateRecipeFoodCost(tenantId: string, recipeId: string)`
  - `recalculateRecipeFoodCost(tenantId: string, recipeId: string)`
- Test cases:
  - Verify `tenantId` is passed and enforced (cannot calculate for a recipe in another tenant).
  - Verify calculation logic: `SUM(cantidad * costoPromedioPonderado) / porciones`.
  - Verify use of `Decimal` (e.g., test with `0.1 + 0.2` precision).
  - Handling of zero `porciones` (should throw or return zero safely).

## Acceptance Criteria

- Tests run and fail as expected (Red phase).
- Tenant isolation is a primary validation point in tests.

## Files Likely Affected

- `apps/api/src/recipes/application/recipe-cost.service.spec.ts`

## Out of Scope

- Implementation of the service.
