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
  phases?: Array<{ name: string; order: number; steps?: string[] }>;
  yieldAmount?: number;
  yieldUnit?: string;
}

export interface IRecipeRepository {
  findAll(
    tenantId: string,
    opts: { limit?: number | null; offset?: number | null },
  ): Promise<Recipe[]>;
  findById(id: string, tenantId: string): Promise<Recipe | null>;
  create(tenantId: string, data: CreateRecipeData): Promise<Recipe>;
}

export interface IRecipeService {
  findAll(
    tenantId: string,
    opts: { limit?: number | null; offset?: number | null },
  ): Promise<Recipe[]>;
  findById(id: string, tenantId: string): Promise<Recipe>;
  create(tenantId: string, data: unknown): Promise<Recipe>;
}
