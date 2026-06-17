import { BaseService } from './base.service';
import { NotFoundError } from '../utils/errors';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import crypto from 'crypto';

// ─── Shape ───────────────────────────────────────────────────────────────────

export interface RecipePhase {
  name: string;
  order: number;
  steps: string[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  phases: RecipePhase[];
  yieldAmount: number | null;
  yieldUnit: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecipeData {
  name: string;
  description?: string;
  phases?: RecipePhase[];
  yieldAmount?: number;
  yieldUnit?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * RecipeService — uses an in-memory Map as a stand-in until the Recipe model
 * is added to the Prisma schema via migration.
 */
export class RecipeService extends BaseService {
  /** In-memory store: tenantId -> id -> Recipe */
  private readonly store = new Map<string, Map<string, Recipe>>();

  private getTenantStore(tenantId: string): Map<string, Recipe> {
    if (!this.store.has(tenantId)) {
      this.store.set(tenantId, new Map());
    }
    return this.store.get(tenantId)!;
  }

  async findAll(
    tenantId: string,
    opts: { limit?: number | null; offset?: number | null } = {},
  ): Promise<Recipe[]> {
    const { take, skip } = this.paginate(opts);
    const all = [...this.getTenantStore(tenantId).values()].filter((r) => r.isActive);
    return all
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(skip, skip + take);
  }

  async findById(id: string, tenantId: string): Promise<Recipe> {
    const recipe = this.getTenantStore(tenantId).get(id);
    if (!recipe || !recipe.isActive) throw new NotFoundError('Recipe', id);
    return recipe;
  }

  async create(tenantId: string, data: CreateRecipeData): Promise<Recipe> {
    const now = new Date();
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? null,
      tenantId,
      phases: data.phases ?? [],
      yieldAmount: data.yieldAmount ?? null,
      yieldUnit: data.yieldUnit ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.getTenantStore(tenantId).set(recipe.id, recipe);
    return recipe;
  }

  async update(id: string, tenantId: string, data: Partial<CreateRecipeData>): Promise<Recipe> {
    const existing = await this.findById(id, tenantId);
    const updated: Recipe = {
      ...existing,
      ...data,
      phases: data.phases ?? existing.phases,
      updatedAt: new Date(),
    };
    this.getTenantStore(tenantId).set(id, updated);
    return updated;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const existing = await this.findById(id, tenantId);
    this.getTenantStore(tenantId).set(id, { ...existing, isActive: false, updatedAt: new Date() });
    return true;
  }
}
