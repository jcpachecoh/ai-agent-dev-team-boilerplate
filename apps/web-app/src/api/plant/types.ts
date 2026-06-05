export type PlantRecipeCategory = {
  id: string;
  tenantId: string;
  nombre: string;
  descripcion: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlantProductionRecipe = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  category?: { id: string; nombre: string } | null;
  name: string;
  finishedProductId: string;
  batchSize: string;
  batchUnit: string;
  packageWeight: string | null;
  estimatedMinutes: number;
  version: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlantProductionOrder = {
  id: string;
  tenantId: string;
  number: string;
  status: string;
  priority: string;
  shift: string;
  plannedStartAt: string;
  recipeId: string;
  recipeName?: string;
};

export type PlantRecipePhaseInput = {
  id: string;
  supplyItemId: string;
  quantityPerBatch: string;
  unit: string;
  isOptional: boolean;
};

export type PlantRecipePhase = {
  id: string;
  order: number;
  name: string;
  description: string | null;
  workStationId: string;
  standardMinutes: number;
  requiresQA: boolean;
  inputs: PlantRecipePhaseInput[];
};

export type PlantRecipeDetail = PlantProductionRecipe & {
  categoryName?: string | null;
  phases: PlantRecipePhase[];
  totalStandardMinutes: number;
};

export type UpdatePlantRecipePhaseInput = {
  order?: number;
  name?: string;
  description?: string;
  workStationId?: string;
  standardMinutes?: number;
  requiresQA?: boolean;
  inputs?: Array<{
    supplyItemId: string;
    quantityPerBatch: string;
    unit: string;
    isOptional?: boolean;
  }>;
};

export type PlantWorkStation = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
};

export type PlantProductionPhase = {
  id: string;
  tenantId: string;
  recipeId: string;
  workStationId: string;
  order: number;
  name: string;
  description: string | null;
  standardMinutes: number;
  requiresQA: boolean;
};

export type CreatePlantRecipePhaseInput = {
  order: number;
  name: string;
  description?: string;
  workStationId: string;
  standardMinutes: number;
  minOperators?: number;
  maxOperators?: number;
  requiresQA?: boolean;
  inputs?: Array<{
    supplyItemId: string;
    quantityPerBatch: string;
    unit: string;
    isOptional?: boolean;
  }>;
};

export type CreatePlantRecipeInput = {
  name: string;
  categoryId?: string | null;
  finishedProductId: string;
  batchSize: string;
  batchUnit: string;
  packageWeight?: string | null;
  estimatedMinutes: number;
  notes?: string;
  isActive?: boolean;
  phases: CreatePlantRecipePhaseInput[];
};
