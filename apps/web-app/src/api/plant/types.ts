export type PlantRecipeCategory = {
  id: string;
  tenantId: string;
  nombre: string;
  descripcion: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecipeType = 'FINAL_PRODUCT' | 'SUB_RECIPE' | 'BASE_PRODUCTION' | 'COMBO' | 'SIDE';

export type RecipeLifecycleStatus = 'TRIAL' | 'ACTIVE' | 'INACTIVE';

export type OperationCenter = 'PLANT' | 'LOCATION' | 'ALL';

export type TechnicalResponsible = 'CHEF' | 'PRODUCTION' | 'QUALITY';

export type RecipeAllergen = 'GLUTEN' | 'DAIRY' | 'EGG' | 'NUTS';

export type BatchDisplayUnit = 'UNIT' | 'PORTION' | 'KILOGRAM' | 'LITER' | 'TRAY' | 'BATCH';

export type PlantProductionRecipe = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  category?: { id: string; nombre: string } | null;
  code: string | null;
  name: string;
  recipeType: RecipeType | null;
  finishedProductId: string | null;
  batchSize: string;
  batchUnit: string;
  batchDisplayUnit: BatchDisplayUnit | null;
  packageWeight: string | null;
  packageWeightGrams: number | null;
  expectedYield: string | null;
  expectedYieldUnit: string | null;
  estimatedMinutes: number;
  version: number;
  lifecycleStatus: RecipeLifecycleStatus;
  isActive: boolean;
  isDraft: boolean;
  operationCenter: OperationCenter | null;
  technicalResponsible: TechnicalResponsible | null;
  allergens: RecipeAllergen[];
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlantRecipeStatusHistoryEntry = {
  id: string;
  fromStatus: RecipeLifecycleStatus | null;
  toStatus: RecipeLifecycleStatus;
  changedByUserId: string | null;
  reason: string | null;
  createdAt: string;
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
  phaseType?: string;
  equipment?: string[];
  finalWeight?: string | null;
  requiredPackaging?: string | null;
  shelfLifeValue?: number | null;
  shelfLifeUnit?: string | null;
  storageCondition?: string | null;
  rejectionCriteria?: string[];
  compositionLineIds?: string[];
};

export type PlantRecipeCompositionLine = {
  id: string;
  supplyItemId: string;
  supplyItemCode: string;
  supplyItemName: string;
  componentType: RecipeComponentType;
  usageUnit: RecipeUsageUnit;
  grossQuantity: string;
  netQuantity: string;
  sortOrder: number;
  shrinkagePercent: number;
};

export type RecipeComponentType =
  | 'INGREDIENT'
  | 'SUB_RECIPE'
  | 'PACKAGING'
  | 'SAUCE'
  | 'TOPPING'
  | 'DECORATION';

export type RecipeUsageUnit = 'GRAM' | 'MILLILITER' | 'UNIT' | 'KILOGRAM' | 'LITER' | 'OUNCE';

export type PlantRecipeDetail = PlantProductionRecipe & {
  categoryName?: string | null;
  locationIds?: string[];
  phases: PlantRecipePhase[];
  composition: PlantRecipeCompositionLine[];
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
  categoryId: string;
  recipeType?: RecipeType;
  finishedProductId?: string;
  batchSize?: string;
  batchUnit?: string;
  batchDisplayUnit?: BatchDisplayUnit;
  packageWeight?: string | null;
  packageWeightGrams?: number;
  expectedYield?: string;
  expectedYieldUnit?: string;
  estimatedMinutes?: number;
  operationCenter?: OperationCenter;
  locationIds?: string[];
  technicalResponsible?: TechnicalResponsible;
  allergens?: RecipeAllergen[];
  notes?: string;
  isDraft?: boolean;
  isActive?: boolean;
  phases?: CreatePlantRecipePhaseInput[];
  composition?: Array<{
    supplyItemId: string;
    componentType: RecipeComponentType;
    usageUnit: RecipeUsageUnit;
    grossQuantity: string;
    netQuantity: string;
    sortOrder: number;
  }>;
};
