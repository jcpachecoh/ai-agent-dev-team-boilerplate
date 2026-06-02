import { Injectable, NotFoundException } from '@nestjs/common';
import { RecipeRepository } from '../repository/recipe.repository';
import type { IRecipeService, Recipe } from '../interfaces/recipe.interfaces';
import { validate, CreateRecipeSchema } from '../../utils/validation';

@Injectable()
export class RecipeService implements IRecipeService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async findAll(
    tenantId: string,
    opts: { limit?: number | null; offset?: number | null } = {},
  ): Promise<Recipe[]> {
    return this.recipeRepository.findAll(tenantId, opts);
  }

  async findById(id: string, tenantId: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findById(id, tenantId);
    if (!recipe) throw new NotFoundException(`Recipe with id "${id}" not found`);
    return recipe;
  }

  async create(tenantId: string, data: unknown): Promise<Recipe> {
    const validated = validate(CreateRecipeSchema, data);
    return this.recipeRepository.create(tenantId, validated);
  }
}
