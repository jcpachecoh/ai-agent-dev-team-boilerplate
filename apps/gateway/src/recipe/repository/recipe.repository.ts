import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import type {
  IRecipeRepository,
  Recipe,
  CreateRecipeData,
  RecipePhase,
} from '../interfaces/recipe.interfaces';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../utils/constants';

/**
 * In-memory recipe store — stand-in until the Recipe model is added to Prisma.
 * Uses a Map: tenantId -> id -> Recipe
 */
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
    const all = [...this.getTenantStore(tenantId).values()].filter((r) => r.isActive);
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
    const phases: RecipePhase[] = (data.phases ?? []).map((p) => ({
      name: p.name,
      order: p.order,
      steps: p.steps ?? [],
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
