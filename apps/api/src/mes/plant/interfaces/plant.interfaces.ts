import type {
  AlarmSeverity,
  IncidentType,
  PhaseExecution,
  PhaseExecutionStatus,
  PhaseInput,
  ProductionIncident,
  ProductionOrder,
  ProductionOrderStatus,
  ProductionPhase,
  ProductionPriority,
  ProductionByproduct,
  ProductionOrderMaterial,
  ProductionQualityCheck,
  ProductionQualityCheckType,
  ProductionRecipe,
  ProductionShift,
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
  categoryId?: string | null;
  finishedProductId: string;
  batchSize: Decimal;
  batchUnit: StockUnit;
  packageWeight?: Decimal | null;
  estimatedMinutes: number;
  notes?: string | null;
  isActive?: boolean;
  phases: CreatePhaseNestedInput[];
}

export interface UpdateRecipeInput {
  name?: string;
  categoryId?: string | null;
  finishedProductId?: string;
  batchSize?: Decimal;
  batchUnit?: StockUnit;
  packageWeight?: Decimal | null;
  estimatedMinutes?: number;
  notes?: string | null;
  isActive?: boolean;
}

/** Payload for repository transactional recipe + phases + inputs create. */
export interface CreateRecipeWithPhasesTxInput {
  tenantId: string;
  recipe: {
    name: string;
    categoryId?: string | null;
    finishedProductId: string;
    batchSize: Decimal;
    batchUnit: StockUnit;
    packageWeight?: Decimal | null;
    estimatedMinutes: number;
    version: number;
    notes?: string | null;
    isActive?: boolean;
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

export type RecipeCategorySummary = {
  id: string;
  nombre: string;
};

export type RecipeWithPhasesAndInputs = ProductionRecipe & {
  category: RecipeCategorySummary | null;
  phases: Array<ProductionPhase & { inputs: PhaseInput[] }>;
};

export interface RecipeDetailResponse extends ProductionRecipe {
  categoryName?: string | null;
  phases: Array<ProductionPhase & { inputs: PhaseInput[] }>;
  totalStandardMinutes: number;
}

export interface OrderMaterialSnapshotLine {
  supplyItemId: string;
  materialName: string;
  requiredQuantity: Decimal;
  unit: StockUnit;
  sortOrder: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase reorder & phase inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface ReorderPhaseItem {
  phaseId: string;
  newOrder: number;
}

export interface UpdatePhaseInput {
  order?: number;
  name?: string;
  description?: string | null;
  workStationId?: string;
  standardMinutes?: number;
  minOperators?: number;
  maxOperators?: number;
  requiresQA?: boolean;
  inputs?: CreatePhaseInputNestedInput[];
}

export interface CreatePhaseOnRecipeData {
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
// Production orders
// ─────────────────────────────────────────────────────────────────────────────

/** Supervisor decision when cancelling an in-progress order (audit-only in MES-05). */
export enum ConsumedInputsAction {
  SCRAP = 'SCRAP',
  RETURN_TO_STOCK = 'RETURN_TO_STOCK',
  HOLD_FOR_REVIEW = 'HOLD_FOR_REVIEW',
}

export interface CreateOrderInput {
  recipeId: string;
  batchCount: number;
  shift: ProductionShift;
  priority?: ProductionPriority;
  plannedStartAt: Date;
  plannedEndAt: Date;
  supervisorId?: string | null;
  notes?: string | null;
  committeeId: string;
}

export interface CreateOrderWithExecutionsTxInput {
  tenantId: string;
  number: string;
  recipeId: string;
  recipeVersion: number;
  batchCount: number;
  shift: ProductionShift;
  priority: ProductionPriority;
  plannedQuantity: Decimal;
  unit: StockUnit;
  plannedStartAt: Date;
  plannedEndAt: Date;
  supervisorId?: string | null;
  notes?: string | null;
  committeeId: string;
}

export interface ListOrdersFilters {
  status?: ProductionOrderStatus;
  shift?: ProductionShift;
  priority?: ProductionPriority;
  plannedStartFrom?: Date;
  plannedStartTo?: Date;
  committeeId?: string;
}

export interface UpdateOrderData {
  status?: ProductionOrderStatus;
  notes?: string | null;
  actualStartAt?: Date | null;
  actualEndAt?: Date | null;
  producedQuantity?: Decimal | null;
}

export interface UpdateExecutionData {
  status?: PhaseExecutionStatus;
  actualMinutes?: number | null;
  producedQuantity?: Decimal | null;
  qaApprovedAt?: Date | null;
  qaApprovedBy?: string | null;
  completedAt?: Date | null;
  notes?: string | null;
}

export interface PauseOrderInput {
  reason: string;
}

export interface CancelOrderInput {
  reason: string;
  consumedInputsAction?: ConsumedInputsAction;
}

export interface QaApproveInput {
  notes?: string | null;
}

export interface CompleteExecutionInput {
  producedQuantity?: Decimal | null;
  actualMinutes?: number | null;
  notes?: string | null;
}

export type OrderListRow = ProductionOrder & {
  committee?: { id: string; number: string } | null;
};

export interface OrderListItemResponse {
  id: string;
  tenantId: string;
  number: string;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  shift: ProductionShift;
  plannedStartAt: Date;
  recipeId: string;
  recipeName?: string;
  committeeId?: string | null;
  committeeNumber?: string | null;
}

export type OrderExecutionDetail = PhaseExecution & {
  phase: Pick<ProductionPhase, 'id' | 'order' | 'name' | 'requiresQA' | 'workStationId'>;
};

export type ActiveOperatorSessionDetail = {
  id: string;
  workStationId: string;
  operatorUserId: string;
  phaseExecutionId: string | null;
  startedAt: Date;
};

export type OrderDetail = ProductionOrder & {
  recipe: Pick<ProductionRecipe, 'id' | 'name' | 'packageWeight'>;
  committee?: { id: string; number: string } | null;
  executions: OrderExecutionDetail[];
  activeSessions: ActiveOperatorSessionDetail[];
  materials: ProductionOrderMaterial[];
  byproducts: ProductionByproduct[];
  qualityChecks: ProductionQualityCheck[];
};

export interface OrderDetailResponse {
  id: string;
  tenantId: string;
  number: string;
  recipeId: string;
  recipeName: string;
  recipeVersion: number;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  shift: ProductionShift;
  batchCount: number;
  plannedQuantity: string;
  producedQuantity: string | null;
  unit: StockUnit;
  plannedStartAt: Date;
  plannedEndAt: Date;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  supervisorId: string | null;
  notes: string | null;
  lotNumber: string | null;
  productionDate: Date | null;
  deliveryDate: Date | null;
  packageWeight: string | null;
  batchWeight: string | null;
  committeeId: string | null;
  committeeNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  materials: Array<{
    id: string;
    supplyItemId?: string | null;
    materialName: string;
    lotNumber: string | null;
    requiredQuantity: string;
    consumedQuantity: string | null;
    unit: StockUnit;
    sortOrder?: number;
  }>;
  byproducts: Array<{
    id: string;
    itemName: string;
    unit: StockUnit;
    actualQuantity: string | null;
    lotNumber: string | null;
    expirationDate: Date | null;
  }>;
  qualityChecks: Array<{
    id: string;
    checkType: ProductionQualityCheckType;
    temperature: string | null;
    color: string | null;
    smell: string | null;
    texture: string | null;
    notes: string | null;
  }>;
  executions: Array<{
    id: string;
    phaseId: string;
    phaseOrder: number;
    phaseName: string;
    requiresQA: boolean;
    workStationId: string;
    status: PhaseExecutionStatus;
    plannedMinutes: number;
    actualMinutes: number | null;
    producedQuantity: string | null;
    qaApprovedAt: Date | null;
    qaApprovedBy: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    operatorCount: number | null;
    deliveredQuantity: string | null;
    responsibleUserId: string | null;
    responsibleName: string | null;
    notes: string | null;
  }>;
  activeOperators: Array<{
    sessionId: string;
    operatorUserId: string;
    workStationId: string;
    phaseExecutionId: string | null;
    startedAt: Date;
  }>;
}

export type OrderWithExecutions = {
  order: ProductionOrder;
  executions: PhaseExecution[];
};

export interface PhaseStatusChange {
  id: string;
  orderId: string;
  phaseId: string;
  workStationId: string;
  status: PhaseExecutionStatus;
}

export interface ChainResult {
  orderId: string;
  changedExecutions: PhaseStatusChange[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Production incidents (manual — separate from PlantAlarmDispatch)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateIncidentInput {
  workStationId: string;
  executionId?: string | null;
  orderId?: string | null;
  type: IncidentType;
  severity: AlarmSeverity;
  description: string;
  photoUrl?: string | null;
}

export interface ListIncidentsFilters {
  orderId?: string;
  workStationId?: string;
  type?: IncidentType;
  severity?: AlarmSeverity;
  /** When true, only resolved incidents; when false, only open incidents. */
  resolved?: boolean;
}

export interface ResolveIncidentInput {
  resolution: string;
}

export interface IncidentResponse {
  id: string;
  tenantId: string;
  orderId: string | null;
  executionId: string | null;
  workStationId: string;
  operatorUserId: string;
  type: IncidentType;
  severity: AlarmSeverity;
  description: string;
  photoUrl: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
  createdAt: Date;
}

export interface IIncidentRepository {
  createIncident(
    tenantId: string,
    operatorUserId: string,
    input: CreateIncidentInput,
  ): Promise<ProductionIncident>;
  findIncidents(
    tenantId: string,
    filters: ListIncidentsFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<ProductionIncident[]>;
  findIncidentById(tenantId: string, id: string): Promise<ProductionIncident | null>;
  resolveIncident(
    tenantId: string,
    id: string,
    resolvedBy: string,
    input: ResolveIncidentInput,
  ): Promise<ProductionIncident>;
}

export interface IIncidentService {
  createIncident(
    tenantId: string,
    operatorUserId: string,
    input: CreateIncidentInput,
  ): Promise<IncidentResponse>;
  listIncidents(
    tenantId: string,
    filters: ListIncidentsFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<IncidentResponse[]>;
  resolveIncident(
    tenantId: string,
    incidentId: string,
    resolvedBy: string,
    input: ResolveIncidentInput,
  ): Promise<IncidentResponse>;
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
  createPhaseWithInputsTx(
    tenantId: string,
    recipeId: string,
    phase: CreatePhaseOnRecipeData,
  ): Promise<ProductionPhase>;
  updatePhase(tenantId: string, id: string, data: UpdatePhaseInput): Promise<ProductionPhase>;
  deletePhase(tenantId: string, id: string): Promise<void>;
  countPhaseExecutions(tenantId: string, phaseId: string): Promise<number>;
  reorderPhasesTx(tenantId: string, recipeId: string, items: ReorderPhaseItem[]): Promise<void>;

  // Phase inputs
  findPhaseInputById(tenantId: string, id: string): Promise<PhaseInput | null>;
  createPhaseInput(data: CreatePhaseInputData): Promise<PhaseInput>;
  deletePhaseInput(tenantId: string, phaseId: string, inputId: string): Promise<PhaseInput>;

  // Production orders
  createOrderWithExecutionsTx(
    input: CreateOrderWithExecutionsTxInput,
  ): Promise<OrderWithExecutions>;
  findOrders(tenantId: string, filters: ListOrdersFilters): Promise<OrderListRow[]>;
  findOrderDetailById(tenantId: string, id: string): Promise<OrderDetail | null>;
  replaceOrderMaterialsTx(
    tenantId: string,
    orderId: string,
    materials: OrderMaterialSnapshotLine[],
  ): Promise<void>;
  updateOrder(tenantId: string, id: string, data: UpdateOrderData): Promise<ProductionOrder>;
  findExecutionById(tenantId: string, id: string): Promise<PhaseExecution | null>;
  updateExecution(tenantId: string, id: string, data: UpdateExecutionData): Promise<PhaseExecution>;
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

  // Phases — POST /plant/recipes/:id/phases, PATCH/DELETE /plant/phases/:id, reorder
  createPhaseOnRecipe(
    tenantId: string,
    recipeId: string,
    input: CreatePhaseNestedInput,
  ): Promise<ProductionPhase>;
  updatePhase(tenantId: string, phaseId: string, input: UpdatePhaseInput): Promise<ProductionPhase>;
  deletePhase(tenantId: string, phaseId: string): Promise<void>;
  reorderPhases(tenantId: string, recipeId: string, items: ReorderPhaseItem[]): Promise<void>;

  // Phase inputs — POST/DELETE /plant/phases/:id/inputs
  addPhaseInput(
    tenantId: string,
    phaseId: string,
    input: CreatePhaseInputInput,
  ): Promise<PhaseInput>;
  removePhaseInput(tenantId: string, phaseId: string, inputId: string): Promise<PhaseInput>;

  // Production orders — POST/GET /plant/orders, lifecycle routes
  createOrder(tenantId: string, input: CreateOrderInput): Promise<OrderDetailResponse>;
  findOrders(tenantId: string, filters: ListOrdersFilters): Promise<OrderListItemResponse[]>;
  findOrderById(tenantId: string, id: string): Promise<OrderDetailResponse>;
  planOrder(tenantId: string, id: string): Promise<OrderDetailResponse>;
  pauseOrder(tenantId: string, id: string, input: PauseOrderInput): Promise<OrderDetailResponse>;
  resumeOrder(tenantId: string, id: string): Promise<OrderDetailResponse>;
  cancelOrder(
    tenantId: string,
    id: string,
    input: CancelOrderInput,
    cancelledBy: string,
  ): Promise<OrderDetailResponse>;
}

/** Internal phase chain — no HTTP route in MES-05. */
export interface IPhaseChainService {
  completeExecution(
    tenantId: string,
    executionId: string,
    input: CompleteExecutionInput,
  ): Promise<ChainResult>;
  qaApproveExecution(
    tenantId: string,
    executionId: string,
    supervisorId: string,
    input?: QaApproveInput,
  ): Promise<ChainResult>;
}
