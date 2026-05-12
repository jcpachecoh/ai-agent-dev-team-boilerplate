import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RecipesRepository } from '../infrastructure/recipes.repository';
import { RecipeItemsRepository } from '../infrastructure/recipe-items.repository';
import { RecipeCostService } from './recipe-cost.service';
import { CreateRecipeDto } from '../api/dto/create-recipe.dto';
import { UpdateRecipeDto } from '../api/dto/update-recipe.dto';
import { AddRecipeItemDto } from '../api/dto/add-recipe-item.dto';

@Injectable()
export class RecipesService {
  constructor(
    private readonly recipesRepo: RecipesRepository,
    private readonly recipeItemsRepo: RecipeItemsRepository,
    private readonly recipeCostService: RecipeCostService,
  ) {}

  async create(tenantId: string, dto: CreateRecipeDto) {
    const productExists = await this.recipesRepo.productExistsForTenant(tenantId, dto.productId);
    if (!productExists) {
      throw new NotFoundException(`Product ${dto.productId} not found for this tenant`);
    }

    return this.recipesRepo.create(tenantId, dto);
  }

  async findAll(tenantId: string) {
    return this.recipesRepo.findManyByTenant(tenantId);
  }

  async update(tenantId: string, id: string, dto: UpdateRecipeDto) {
    const recipe = await this.recipesRepo.findByIdForTenant(tenantId, id);
    if (!recipe) {
      throw new NotFoundException(`Recipe ${id} not found`);
    }

    const updated = await this.recipesRepo.update(tenantId, id, dto);

    if (dto.porciones !== undefined && dto.porciones !== recipe.porciones) {
      await this.recipeCostService.recalculateRecipeFoodCost(tenantId, id);
    }

    return updated;
  }

  async addItem(tenantId: string, recipeId: string, dto: AddRecipeItemDto) {
    const recipe = await this.recipesRepo.findByIdForTenant(tenantId, recipeId);
    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    const supplyItemExists = await this.recipeItemsRepo.supplyItemExistsForTenant(
      tenantId,
      dto.supplyItemId,
    );
    if (!supplyItemExists) {
      throw new NotFoundException(`Supply Item ${dto.supplyItemId} not found`);
    }

    const item = await this.recipeItemsRepo.create(tenantId, recipeId, dto);

    await this.recipeCostService.recalculateRecipeFoodCost(tenantId, recipeId);

    return item;
  }
}
