# Spec: Recipes and Food Cost Management

## 1. Goal

Provide a robust system to manage food recipes, track their unit costs based on ingredients (Supply Items), and ensure these costs are updated reactively when ingredient prices change.

## 2. Context

RestOpsIQ needs to provide restaurant managers with precise "Food Cost" insights. This requires linking Recipes to Products (what is sold) and Supply Items (what is bought).

## 3. Data Models

### Recipe

- `id`: string (cuid)
- `tenantId`: string (Mandatory isolation)
- `productId`: string (FK to Products placeholder)
- `nombre`: string
- `porciones`: Int
- `notas`: string?
- `isActive`: boolean
- `foodCostActual`: Decimal (Cached calculated cost)

### RecipeItem

- `id`: string (cuid)
- `tenantId`: string (Mandatory isolation)
- `recipeId`: string (FK to Recipe)
- `supplyItemId`: string (FK to SupplyItems placeholder)
- `cantidad`: Decimal
- `unidad`: StockUnit (Enum)
- `notas`: string?

### Placeholders (Temporary Schema Dependencies)

- **Product**: Minimal model for FK target.
  - `id`: string
  - `tenantId`: string
- **SupplyItem**: Minimal model for FK target.
  - `id`: string
  - `tenantId`: string
  - `costoPromedioPonderado`: Decimal

## 4. Business Logic: Food Cost Calculation

`food_cost_unitario = SUM(item.cantidad * supplyItem.costoPromedioPonderado) / recipe.porciones`

- **Rules:**
  - Use `Decimal.js` for all arithmetic. No float/number types for money.
  - `tenantId` must match across Recipe, Product, and SupplyItem.
  - Every data access operation must be tenant-scoped.
  - `porciones` must be > 0.

## 5. Reactive Strategy

The system provides a method to trigger recalculations when ingredient costs change:
`recalculateRecipesUsingSupplyItem(tenantId: string, supplyItemId: string)`

- **Logic:**
  1. Identify all `RecipeItems` using that `supplyItemId` within the tenant.
  2. Find unique `RecipeIds` from those items.
  3. For each recipe, call `recalculateRecipeFoodCost(tenantId, recipeId)`.

## 6. API Requirements

- `POST /recipes`: Create recipe.
- `GET /recipes`: List for tenant.
- `PATCH /recipes/:id`: Update metadata.
- `POST /recipes/:id/items`: **Add** ingredient only. (Update/Delete out of scope).

## 7. Out of Scope

- Inventory movements.
- Full Supply Chain CRUD.
- UI/Frontend.
- Update/Delete for individual RecipeItems.
- Async infrastructure (BullMQ/Events) unless already established.
