# Task 05: Recipes API

## Goal

Expose REST endpoints for Recipe and ingredient management.

## Requirements

- Implement `RecipesController`:
  - `POST /recipes`: Create metadata using `CreateRecipeDto`.
  - `GET /recipes`: List for the current tenant.
  - `PATCH /recipes/:id`: Update metadata (`nombre`, `porciones`, etc.) using `UpdateRecipeDto`.
  - `POST /recipes/:id/items`: **Add item only** using `AddRecipeItemDto`.
- Create the following DTOs in `apps/api/src/recipes/api/dto/`:
  - `CreateRecipeDto`: Fields for recipe creation (nombre, porciones, productId, etc.).
  - `UpdateRecipeDto`: Partial fields for recipe updates.
  - `AddRecipeItemDto`: Fields to add an ingredient (supplyItemId, cantidad, unidad, etc.).
- Enforce `tenantId` from request context (Auth/Request).
- No `tenantId` should be accepted from the request body.
- Validate that the Recipe, Product, and SupplyItem all belong to the same tenant.

## Acceptance Criteria

- Endpoints return correct status codes.
- `POST /recipes/:id/items` correctly appends an ingredient to the recipe.
- Cross-tenant access is blocked.

## Files Likely Affected

- `apps/api/src/recipes/api/recipes.controller.ts`
- `apps/api/src/recipes/recipes.module.ts`
- `apps/api/src/recipes/api/dto/`

## Out of Scope

- Updating or deleting existing recipe items.
- Reactive triggers.
