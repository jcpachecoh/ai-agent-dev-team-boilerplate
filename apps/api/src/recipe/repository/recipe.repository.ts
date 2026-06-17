import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../utils/constants';
import type {
  CreateRecipeData,
  IRecipeRepository,
  Recipe,
  RecipePhase,
} from '../interfaces/recipe.interfaces';

@Injectable()
export class RecipeRepository implements IRecipeRepository {
  private readonly store = new Map<string, Map<string, Recipe>>();

  private getTenantStore(tenantId: string): Map<string, Recipe> {
    if (!this.store.has(tenantId)) {
      this.store.set(tenantId, new Map());
    }
    return this.store.get(tenantId)!;
  }

  async findAll(
    tenantId: string,
    opts: { limit?: number | null; offset?: number | null },
  ): Promise<Recipe[]> {
    const take = Math.min(Math.max(1, opts.limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
    const skip = Math.max(0, opts.offset ?? 0);
    const all = [...this.getTenantStore(tenantId).values()].filter((recipe) => recipe.isActive);
    return all
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + take);
  }

  async findById(id: string, tenantId: string): Promise<Recipe | null> {
    const recipe = this.getTenantStore(tenantId).get(id);
    if (!recipe || !recipe.isActive) return null;
    return recipe;
  }

  async create(tenantId: string, data: CreateRecipeData): Promise<Recipe> {
    const now = new Date();
    const phases: RecipePhase[] = (data.phases ?? []).map((phase) => ({
      name: phase.name,
      order: phase.order,
      steps: phase.steps ?? [],
    }));

    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? null,
      tenantId,
      phases,
      yieldAmount: data.yieldAmount ?? null,
      yieldUnit: data.yieldUnit ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.getTenantStore(tenantId).set(recipe.id, recipe);
    return recipe;
  }
}
