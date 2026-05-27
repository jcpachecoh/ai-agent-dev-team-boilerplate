import type {
  PhaseInput,
  ProductionPhase,
  ProductionRecipe,
  StockUnit,
  WorkStation,
} from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

// ─────────────────────────────────────────────────────────────────────────────
// Workstation
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateWorkStationInput {
  name: string;
  code: string;
  description?: string | null;
  location?: string | null;
}

export interface UpdateWorkStationInput {
  name?: string;
  code?: string;
  description?: string | null;
  location?: string | null;
  isActive?: boolean;
}

export interface CreateWorkStationData extends CreateWorkStationInput {
  tenantId: string;
}

export interface UpdateWorkStationData extends UpdateWorkStationInput {}

// ─────────────────────────────────────────────────────────────────────────────
// Recipe — nested create
// ─────────────────────────────────────────────────────────────────────────────

export interface CreatePhaseInputNestedInput {
  supplyItemId: string;
  quantityPerBatch: Decimal;
  unit: StockUnit;
  isOptional?: boolean;
}

export interface CreatePhaseNestedInput {
  order: number;
  name: string;
  description?: string | null;
  workStationId: string;
  standardMinutes: number;
  minOperators?: number;
  maxOperators?: number;
  requiresQA?: boolean;
  inputs?: CreatePhaseInputNestedInput[];
}

export interface CreateRecipeWithPhasesInput {
  name: string;
  finishedProductId: string;
  batchSize: Decimal;
  batchUnit: StockUnit;
  estimatedMinutes: number;
  notes?: string | null;
  phases: CreatePhaseNestedInput[];
}

export interface UpdateRecipeInput {
  name?: string;
  finishedProductId?: string;
  batchSize?: Decimal;
  batchUnit?: StockUnit;
  estimatedMinutes?: number;
  notes?: string | null;
  isActive?: boolean;
}

/** Payload for repository transactional recipe + phases + inputs create. */
export interface CreateRecipeWithPhasesTxInput {
  tenantId: string;
  recipe: {
    name: string;
    finishedProductId: string;
    batchSize: Decimal;
    batchUnit: StockUnit;
    estimatedMinutes: number;
    version: number;
    notes?: string | null;
  };
  phases: Array<{
    order: number;
    name: string;
    description?: string | null;
    workStationId: string;
    standardMinutes: number;
    minOperators: number;
    maxOperators: number;
    requiresQA: boolean;
    inputs: Array<{
      supplyItemId: string;
      quantityPerBatch: Decimal;
      unit: StockUnit;
      isOptional: boolean;
    }>;
  }>;
  /** When versioning: id of the active recipe to deactivate in the same transaction. */
  deactivateRecipeId?: string;
}

export type RecipeWithPhasesAndInputs = ProductionRecipe & {
  phases: Array<ProductionPhase & { inputs: PhaseInput[] }>;
};

export interface RecipeDetailResponse extends ProductionRecipe {
  phases: Array<ProductionPhase & { inputs: PhaseInput[] }>;
  totalStandardMinutes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase reorder & phase inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface ReorderPhaseItem {
  phaseId: string;
  newOrder: number;
}

export interface CreatePhaseInputInput {
  supplyItemId: string;
  quantityPerBatch: Decimal;
  unit: StockUnit;
  isOptional?: boolean;
}

export interface CreatePhaseInputData extends CreatePhaseInputInput {
  tenantId: string;
  phaseId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

export interface IPlantRepository {
  // Workstations
  findAllWorkStations(tenantId: string): Promise<WorkStation[]>;
  findWorkStationById(tenantId: string, id: string): Promise<WorkStation | null>;
  findWorkStationByCode(tenantId: string, code: string): Promise<WorkStation | null>;
  createWorkStation(data: CreateWorkStationData): Promise<WorkStation>;
  updateWorkStation(
    tenantId: string,
    id: string,
    data: UpdateWorkStationData,
  ): Promise<WorkStation>;
  softDeleteWorkStation(tenantId: string, id: string): Promise<WorkStation>;
  hasActiveExecutionsForWorkStation(tenantId: string, workStationId: string): Promise<boolean>;

  // Recipes
  findAllRecipes(tenantId: string): Promise<ProductionRecipe[]>;
  findRecipeById(tenantId: string, id: string): Promise<ProductionRecipe | null>;
  findActiveRecipeByName(tenantId: string, name: string): Promise<ProductionRecipe | null>;
  findRecipeDetailById(tenantId: string, id: string): Promise<RecipeWithPhasesAndInputs | null>;
  createRecipeWithPhasesTx(input: CreateRecipeWithPhasesTxInput): Promise<ProductionRecipe>;
  updateRecipe(tenantId: string, id: string, data: UpdateRecipeInput): Promise<ProductionRecipe>;
  softDeleteRecipe(tenantId: string, id: string): Promise<ProductionRecipe>;
  cloneRecipeTx(
    tenantId: string,
    sourceRecipeId: string,
    newRecipeData: {
      name: string;
      finishedProductId: string;
      batchSize: Decimal;
      batchUnit: StockUnit;
      estimatedMinutes: number;
      version: number;
      notes?: string | null;
    },
  ): Promise<ProductionRecipe>;

  // Phases
  findPhaseById(tenantId: string, id: string): Promise<ProductionPhase | null>;
  findPhasesByRecipeId(tenantId: string, recipeId: string): Promise<ProductionPhase[]>;
  reorderPhasesTx(tenantId: string, recipeId: string, items: ReorderPhaseItem[]): Promise<void>;

  // Phase inputs
  findPhaseInputById(tenantId: string, id: string): Promise<PhaseInput | null>;
  createPhaseInput(data: CreatePhaseInputData): Promise<PhaseInput>;
  deletePhaseInput(tenantId: string, phaseId: string, inputId: string): Promise<PhaseInput>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export interface IPlantService {
  // Workstations — POST/GET/PATCH/DELETE /plant/workstations
  createWorkStation(tenantId: string, input: CreateWorkStationInput): Promise<WorkStation>;
  findAllWorkStations(tenantId: string): Promise<WorkStation[]>;
  updateWorkStation(
    tenantId: string,
    id: string,
    input: UpdateWorkStationInput,
  ): Promise<WorkStation>;
  softDeleteWorkStation(tenantId: string, id: string): Promise<WorkStation>;

  // Recipes — POST/GET/PATCH/DELETE /plant/recipes, GET :id, POST :id/clone
  createRecipe(tenantId: string, input: CreateRecipeWithPhasesInput): Promise<ProductionRecipe>;
  findAllRecipes(tenantId: string): Promise<ProductionRecipe[]>;
  findRecipeById(tenantId: string, id: string): Promise<RecipeDetailResponse>;
  updateRecipe(tenantId: string, id: string, input: UpdateRecipeInput): Promise<ProductionRecipe>;
  cloneRecipe(tenantId: string, id: string): Promise<ProductionRecipe>;
  softDeleteRecipe(tenantId: string, id: string): Promise<ProductionRecipe>;

  // Phases — PATCH /plant/recipes/:id/phases/reorder
  reorderPhases(tenantId: string, recipeId: string, items: ReorderPhaseItem[]): Promise<void>;

  // Phase inputs — POST/DELETE /plant/phases/:id/inputs
  addPhaseInput(
    tenantId: string,
    phaseId: string,
    input: CreatePhaseInputInput,
  ): Promise<PhaseInput>;
  removePhaseInput(tenantId: string, phaseId: string, inputId: string): Promise<PhaseInput>;
}
