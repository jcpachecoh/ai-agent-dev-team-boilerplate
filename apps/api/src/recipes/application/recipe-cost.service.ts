import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export interface IRecipesRepository {
  findByIdForTenant(tenantId: string, id: string): Promise<any>;
  updateFoodCost(tenantId: string, id: string, foodCostActual: Decimal): Promise<void>;
}

export interface IRecipeItemsRepository {
  findByRecipeForTenant(tenantId: string, recipeId: string): Promise<any[]>;
  findRecipeIdsUsingSupplyItem(tenantId: string, supplyItemId: string): Promise<string[]>;
}

@Injectable()
export class RecipeCostService {
  constructor(
    @Inject('RecipesRepository')
    private readonly recipesRepository: IRecipesRepository,
    @Inject('RecipeItemsRepository')
    private readonly recipeItemsRepository: IRecipeItemsRepository,
  ) {}

  /**
   * Calculates the food cost for a specific recipe.
   * food_cost_unitario = SUM(item.cantidad * supplyItem.costoPromedioPonderado) / recipe.porciones
   */
  async calculateRecipeFoodCost(tenantId: string, recipeId: string): Promise<Decimal> {
    const recipe = await this.recipesRepository.findByIdForTenant(tenantId, recipeId);

    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found for tenant ${tenantId}`);
    }

    if (recipe.porciones <= 0) {
      throw new BadRequestException('Recipe portions must be greater than zero');
    }

    const items = await this.recipeItemsRepository.findByRecipeForTenant(tenantId, recipeId);

    if (items.length === 0) {
      return new Decimal(0);
    }

    let totalCost = new Decimal(0);

    for (const item of items) {
      const itemQuantity = new Decimal(item.cantidad);
      const itemUnitCost = new Decimal(item.supplyItem.costoPromedioPonderado);

      // Decimal addition and multiplication ensure precision
      totalCost = totalCost.add(itemQuantity.mul(itemUnitCost));
    }

    // Decimal division by portions
    return totalCost.div(new Decimal(recipe.porciones));
  }

  /**
   * Calculates the food cost and persists it to the database.
   */
  async recalculateRecipeFoodCost(tenantId: string, recipeId: string): Promise<void> {
    const foodCostActual = await this.calculateRecipeFoodCost(tenantId, recipeId);
    await this.recipesRepository.updateFoodCost(tenantId, recipeId, foodCostActual);
  }

  /**
   * Identifies all recipes using a specific supply item and triggers recalculation for each.
   *
   * FUTURE INTEGRATION POINT: This method should be called by the SupplyItem module
   * (via direct injection or event listener) whenever a SupplyItem's
   * costoPromedioPonderado is updated to ensure food costs remain accurate.
   */
  async recalculateRecipesUsingSupplyItem(tenantId: string, supplyItemId: string): Promise<void> {
    const recipeIds = await this.recipeItemsRepository.findRecipeIdsUsingSupplyItem(
      tenantId,
      supplyItemId,
    );

    // Using a sequential approach for safety, could be optimized with Promise.all if needed
    for (const recipeId of recipeIds) {
      await this.recalculateRecipeFoodCost(tenantId, recipeId);
    }
  }
}
