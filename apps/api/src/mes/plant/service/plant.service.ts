import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PhaseExecutionStatus,
  ProductionOrderStatus,
  ProductionPriority,
  type PhaseInput,
  type ProductionPhase,
  type ProductionRecipe,
  type WorkStation,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RecipeCategoriesService } from '../../../recipe-categories/service/recipe-categories.service';
import { SupplyItemsService } from '../../../supplyitems/service/supplyitems.service';
import { PlantRepository } from '../repository/plant.repository';
import type {
  CancelOrderInput,
  CreateOrderInput,
  CreatePhaseInputInput,
  CreatePhaseNestedInput,
  CreatePhaseOnRecipeData,
  CreateRecipeWithPhasesInput,
  CreateRecipeWithPhasesTxInput,
  CreateWorkStationInput,
  IPlantService,
  ListOrdersFilters,
  OrderDetail,
  OrderDetailResponse,
  OrderListItemResponse,
  OrderMaterialSnapshotLine,
  PauseOrderInput,
  PhaseStatusChange,
  RecipeWithPhasesAndInputs,
  RecipeDetailResponse,
  ReorderPhaseItem,
  UpdatePhaseInput,
  UpdateRecipeInput,
  UpdateWorkStationInput,
} from '../interfaces/plant.interfaces';
import { ConsumedInputsAction } from '../interfaces/plant.interfaces';
import { CommitteeService } from './committee.service';
import { PlantEventsService } from './plant-events.service';

@Injectable()
export class PlantService implements IPlantService {
  constructor(
    private readonly plantRepository: PlantRepository,
    private readonly committeeService: CommitteeService,
    private readonly recipeCategoriesService: RecipeCategoriesService,
    private readonly supplyItemsService: SupplyItemsService,
    private readonly plantEventsService: PlantEventsService,
  ) {}

  // ── Workstations ───────────────────────────────────────────────────────────

  async createWorkStation(tenantId: string, input: CreateWorkStationInput): Promise<WorkStation> {
    const existing = await this.plantRepository.findWorkStationByCode(tenantId, input.code);
    if (existing) {
      throw new ConflictException(`Work station code "${input.code}" is already in use`);
    }

    return this.plantRepository.createWorkStation({
      ...input,
      tenantId,
    });
  }

  findAllWorkStations(tenantId: string): Promise<WorkStation[]> {
    return this.plantRepository.findAllWorkStations(tenantId);
  }

  async updateWorkStation(
    tenantId: string,
    id: string,
    input: UpdateWorkStationInput,
  ): Promise<WorkStation> {
    await this.requireWorkStation(tenantId, id);

    if (input.code !== undefined) {
      const duplicate = await this.plantRepository.findWorkStationByCode(tenantId, input.code);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Work station code "${input.code}" is already in use`);
      }
    }

    return this.plantRepository.updateWorkStation(tenantId, id, input);
  }

  async softDeleteWorkStation(tenantId: string, id: string): Promise<WorkStation> {
    await this.requireWorkStation(tenantId, id);

    const hasActiveExecutions = await this.plantRepository.hasActiveExecutionsForWorkStation(
      tenantId,
      id,
    );
    if (hasActiveExecutions) {
      throw new ConflictException(
        'Cannot deactivate work station while it has active phase executions',
      );
    }

    return this.plantRepository.softDeleteWorkStation(tenantId, id);
  }

  // ── Recipes ────────────────────────────────────────────────────────────────

  async createRecipe(
    tenantId: string,
    input: CreateRecipeWithPhasesInput,
  ): Promise<ProductionRecipe> {
    await this.validateNestedPhases(tenantId, input.phases);
    input.categoryId = await this.resolveCategoryId(tenantId, input.categoryId);

    const activeByName = await this.plantRepository.findActiveRecipeByName(tenantId, input.name);
    const version = activeByName ? activeByName.version + 1 : 1;

    const txInput = this.buildCreateRecipeTxInput(tenantId, input, version, activeByName?.id);
    return this.plantRepository.createRecipeWithPhasesTx(txInput);
  }

  findAllRecipes(tenantId: string): Promise<ProductionRecipe[]> {
    return this.plantRepository.findAllRecipes(tenantId);
  }

  async findRecipeById(tenantId: string, id: string): Promise<RecipeDetailResponse> {
    const recipe = await this.plantRepository.findRecipeDetailById(tenantId, id);
    if (!recipe) {
      throw new NotFoundException(`Production recipe with ID "${id}" not found`);
    }

    const totalStandardMinutes = recipe.phases.reduce(
      (sum, phase) => sum + phase.standardMinutes,
      0,
    );

    return {
      ...recipe,
      categoryName: recipe.category?.nombre ?? null,
      totalStandardMinutes,
    };
  }

  async updateRecipe(
    tenantId: string,
    id: string,
    input: UpdateRecipeInput,
  ): Promise<ProductionRecipe> {
    const recipe = await this.requireRecipe(tenantId, id);

    const updateData: UpdateRecipeInput & { version?: number } = { ...input };

    if (input.categoryId !== undefined) {
      updateData.categoryId = await this.resolveCategoryId(tenantId, input.categoryId);
    }

    if (input.name !== undefined && input.name !== recipe.name) {
      const conflict = await this.plantRepository.findActiveRecipeByName(tenantId, input.name);
      if (conflict && conflict.id !== id) {
        await this.plantRepository.updateRecipe(tenantId, conflict.id, { isActive: false });
        updateData.version = conflict.version + 1;
      }
    }

    return this.plantRepository.updateRecipe(tenantId, id, updateData);
  }

  async cloneRecipe(tenantId: string, id: string): Promise<ProductionRecipe> {
    const source = await this.plantRepository.findRecipeDetailById(tenantId, id);
    if (!source) {
      throw new NotFoundException(`Production recipe with ID "${id}" not found`);
    }

    // Distinct name per clone; same suffix can repeat — versioning applies like create.
    const cloneName = `${source.name} (copia)`;
    const activeByName = await this.plantRepository.findActiveRecipeByName(tenantId, cloneName);
    const version = activeByName ? activeByName.version + 1 : 1;

    if (activeByName) {
      await this.plantRepository.updateRecipe(tenantId, activeByName.id, { isActive: false });
    }

    return this.plantRepository.cloneRecipeTx(tenantId, id, {
      name: cloneName,
      categoryId: source.categoryId,
      finishedProductId: source.finishedProductId,
      batchSize: source.batchSize,
      batchUnit: source.batchUnit,
      packageWeight: source.packageWeight,
      estimatedMinutes: source.estimatedMinutes,
      version,
      notes: source.notes,
    });
  }

  async softDeleteRecipe(tenantId: string, id: string): Promise<ProductionRecipe> {
    await this.requireRecipe(tenantId, id);
    return this.plantRepository.softDeleteRecipe(tenantId, id);
  }

  // ── Phases & phase inputs ────────────────────────────────────────────────────

  async reorderPhases(
    tenantId: string,
    recipeId: string,
    items: ReorderPhaseItem[],
  ): Promise<void> {
    await this.requireRecipe(tenantId, recipeId);

    const phases = await this.plantRepository.findPhasesByRecipeId(tenantId, recipeId);
    this.validateReorderItems(phases, items);

    await this.plantRepository.reorderPhasesTx(tenantId, recipeId, items);
  }

  async createPhaseOnRecipe(
    tenantId: string,
    recipeId: string,
    input: CreatePhaseNestedInput,
  ): Promise<ProductionPhase> {
    await this.requireRecipe(tenantId, recipeId);
    await this.validateNestedPhases(tenantId, [input]);

    return this.plantRepository.createPhaseWithInputsTx(
      tenantId,
      recipeId,
      this.toCreatePhaseOnRecipeData(input),
    );
  }

  async updatePhase(
    tenantId: string,
    phaseId: string,
    input: UpdatePhaseInput,
  ): Promise<ProductionPhase> {
    const phase = await this.requirePhase(tenantId, phaseId);

    if (input.workStationId) {
      await this.requireWorkStation(tenantId, input.workStationId);
    }

    if (
      input.minOperators !== undefined &&
      input.maxOperators !== undefined &&
      input.minOperators > input.maxOperators
    ) {
      throw new BadRequestException(
        `Phase "${input.name ?? phase.name}": minOperators cannot exceed maxOperators`,
      );
    }

    const { inputs, ...phaseData } = input;
    const updated = await this.plantRepository.updatePhase(tenantId, phaseId, phaseData);

    if (inputs !== undefined) {
      for (const phaseInput of inputs) {
        await this.supplyItemsService.findOne(tenantId, phaseInput.supplyItemId);
      }
      await this.plantRepository.replacePhaseInputsTx(
        tenantId,
        phaseId,
        inputs.map((phaseInput) => ({
          supplyItemId: phaseInput.supplyItemId,
          quantityPerBatch: phaseInput.quantityPerBatch,
          unit: phaseInput.unit,
          isOptional: phaseInput.isOptional ?? false,
        })),
      );
    }

    return updated;
  }

  async deletePhase(tenantId: string, phaseId: string): Promise<void> {
    await this.requirePhase(tenantId, phaseId);

    const executionCount = await this.plantRepository.countPhaseExecutions(tenantId, phaseId);
    if (executionCount > 0) {
      throw new ConflictException(
        'Cannot delete a phase that has production executions. Cancel related orders first.',
      );
    }

    await this.plantRepository.deletePhase(tenantId, phaseId);
  }

  async addPhaseInput(
    tenantId: string,
    phaseId: string,
    input: CreatePhaseInputInput,
  ): Promise<PhaseInput> {
    await this.requirePhase(tenantId, phaseId);
    await this.supplyItemsService.findOne(tenantId, input.supplyItemId);

    return this.plantRepository.createPhaseInput({
      tenantId,
      phaseId,
      supplyItemId: input.supplyItemId,
      quantityPerBatch: input.quantityPerBatch,
      unit: input.unit,
      isOptional: input.isOptional,
    });
  }

  async removePhaseInput(tenantId: string, phaseId: string, inputId: string): Promise<PhaseInput> {
    await this.requirePhase(tenantId, phaseId);

    const existing = await this.plantRepository.findPhaseInputById(tenantId, inputId);
    if (!existing || existing.phaseId !== phaseId) {
      throw new NotFoundException(`Phase input with ID "${inputId}" not found`);
    }

    return this.plantRepository.deletePhaseInput(tenantId, phaseId, inputId);
  }

  // ── Production orders ────────────────────────────────────────────────────────

  async createOrder(tenantId: string, input: CreateOrderInput): Promise<OrderDetailResponse> {
    this.validateOrderDates(input.plannedStartAt, input.plannedEndAt);
    this.validateBatchCount(input.batchCount);

    const recipe = await this.plantRepository.findRecipeDetailById(tenantId, input.recipeId);
    if (!recipe) {
      throw new NotFoundException(`Production recipe with ID "${input.recipeId}" not found`);
    }
    if (!recipe.isActive) {
      throw new BadRequestException('Production recipe is inactive and cannot be used for orders');
    }

    if (!input.committeeId) {
      throw new BadRequestException('committeeId is required to create a production order');
    }

    const committee = await this.committeeService.assertCommitteeActiveForOrder(
      tenantId,
      input.committeeId,
    );

    const number = await this.generateOrderNumberForCommittee(
      tenantId,
      input.committeeId,
      committee.number,
    );
    const plannedQuantity = new Decimal(input.batchCount).mul(recipe.batchSize);

    const { executions } = await this.plantRepository.createOrderWithExecutionsTx({
      tenantId,
      number,
      recipeId: recipe.id,
      recipeVersion: recipe.version,
      batchCount: input.batchCount,
      shift: input.shift,
      priority: input.priority ?? ProductionPriority.NORMAL,
      plannedQuantity,
      unit: recipe.batchUnit,
      plannedStartAt: input.plannedStartAt,
      plannedEndAt: input.plannedEndAt,
      supervisorId: input.supervisorId ?? null,
      notes: input.notes ?? null,
      committeeId: input.committeeId,
    });

    if (executions.length !== recipe.phases.length) {
      throw new ConflictException(
        'Order creation failed: execution count does not match recipe phase count',
      );
    }
    if (!executions.every((execution) => execution.status === PhaseExecutionStatus.PENDING)) {
      throw new ConflictException('Order creation failed: executions must all be PENDING');
    }

    const detail = await this.plantRepository.findOrderDetailById(tenantId, executions[0].orderId);
    if (!detail) {
      throw new NotFoundException('Created production order could not be loaded');
    }

    return this.mapOrderDetail(detail);
  }

  async findOrders(tenantId: string, filters: ListOrdersFilters): Promise<OrderListItemResponse[]> {
    const orders = await this.plantRepository.findOrders(tenantId, filters);

    return orders.map((order) => ({
      id: order.id,
      tenantId: order.tenantId,
      number: order.number,
      status: order.status,
      priority: order.priority,
      shift: order.shift,
      plannedStartAt: order.plannedStartAt,
      recipeId: order.recipeId,
      committeeId: order.committeeId,
      committeeNumber: order.committee?.number ?? null,
    }));
  }

  async findOrderById(tenantId: string, id: string): Promise<OrderDetailResponse> {
    let detail = await this.requireOrderDetail(tenantId, id);

    if (this.shouldEnsureMaterialSnapshot(detail)) {
      await this.createMaterialSnapshot(tenantId, detail);
      detail = await this.requireOrderDetail(tenantId, id);
    }

    return this.mapOrderDetail(detail);
  }

  async planOrder(tenantId: string, id: string): Promise<OrderDetailResponse> {
    const detail = await this.requireOrderDetail(tenantId, id);

    if (detail.status !== ProductionOrderStatus.DRAFT) {
      throw new ConflictException(`Cannot plan order in status ${detail.status}`);
    }

    const firstExecution = detail.executions.find((execution) => execution.phase.order === 1);
    if (!firstExecution) {
      throw new BadRequestException('Order has no first phase execution');
    }
    if (firstExecution.status !== PhaseExecutionStatus.PENDING) {
      throw new ConflictException('First phase execution is not in PENDING state');
    }

    await this.plantRepository.updateOrder(tenantId, id, {
      status: ProductionOrderStatus.PLANNED,
    });
    await this.plantRepository.updateExecution(tenantId, firstExecution.id, {
      status: PhaseExecutionStatus.READY,
    });
    await this.createMaterialSnapshot(tenantId, detail);

    this.plantEventsService.emitPhaseStatusChanges(tenantId, [
      {
        id: firstExecution.id,
        orderId: id,
        phaseId: firstExecution.phaseId,
        workStationId: firstExecution.workStationId,
        status: PhaseExecutionStatus.READY,
      },
    ]);

    const updated = await this.requireOrderDetail(tenantId, id);
    return this.mapOrderDetail(updated);
  }

  async pauseOrder(
    tenantId: string,
    id: string,
    input: PauseOrderInput,
  ): Promise<OrderDetailResponse> {
    const reason = input.reason?.trim();
    if (!reason) {
      throw new BadRequestException('reason is required');
    }

    const detail = await this.requireOrderDetail(tenantId, id);
    if (detail.status !== ProductionOrderStatus.IN_PROCESS) {
      throw new ConflictException(`Cannot pause order in status ${detail.status}`);
    }

    const notes = this.appendOrderMetadata(detail.notes, 'pause', {
      reason,
      pausedAt: new Date().toISOString(),
    });

    await this.plantRepository.updateOrder(tenantId, id, {
      status: ProductionOrderStatus.PAUSED,
      notes,
    });

    const pauseChanges: PhaseStatusChange[] = [];

    for (const execution of detail.executions) {
      if (execution.status === PhaseExecutionStatus.IN_PROCESS) {
        await this.plantRepository.updateExecution(tenantId, execution.id, {
          status: PhaseExecutionStatus.PAUSED,
        });
        pauseChanges.push({
          id: execution.id,
          orderId: id,
          phaseId: execution.phaseId,
          workStationId: execution.workStationId,
          status: PhaseExecutionStatus.PAUSED,
        });
      }
    }

    this.plantEventsService.emitPhaseStatusChanges(tenantId, pauseChanges);

    const updated = await this.requireOrderDetail(tenantId, id);
    return this.mapOrderDetail(updated);
  }

  async resumeOrder(tenantId: string, id: string): Promise<OrderDetailResponse> {
    const detail = await this.requireOrderDetail(tenantId, id);

    if (detail.status !== ProductionOrderStatus.PAUSED) {
      throw new ConflictException(`Cannot resume order in status ${detail.status}`);
    }

    await this.plantRepository.updateOrder(tenantId, id, {
      status: ProductionOrderStatus.IN_PROCESS,
    });

    const resumeChanges: PhaseStatusChange[] = [];

    for (const execution of detail.executions) {
      if (execution.status === PhaseExecutionStatus.PAUSED) {
        await this.plantRepository.updateExecution(tenantId, execution.id, {
          status: PhaseExecutionStatus.IN_PROCESS,
        });
        resumeChanges.push({
          id: execution.id,
          orderId: id,
          phaseId: execution.phaseId,
          workStationId: execution.workStationId,
          status: PhaseExecutionStatus.IN_PROCESS,
        });
      }
    }

    this.plantEventsService.emitPhaseStatusChanges(tenantId, resumeChanges);

    const updated = await this.requireOrderDetail(tenantId, id);
    return this.mapOrderDetail(updated);
  }

  async cancelOrder(
    tenantId: string,
    id: string,
    input: CancelOrderInput,
    cancelledBy: string,
  ): Promise<OrderDetailResponse> {
    const reason = input.reason?.trim();
    if (!reason) {
      throw new BadRequestException('reason is required');
    }

    const detail = await this.requireOrderDetail(tenantId, id);

    if (detail.status === ProductionOrderStatus.COMPLETED) {
      throw new ConflictException('Cannot cancel a completed order');
    }
    if (detail.status === ProductionOrderStatus.CANCELLED) {
      throw new ConflictException('Order is already cancelled');
    }

    const requiresConsumedInputsAction =
      detail.status === ProductionOrderStatus.IN_PROCESS ||
      detail.status === ProductionOrderStatus.PAUSED;

    if (requiresConsumedInputsAction && !input.consumedInputsAction) {
      throw new BadRequestException(
        'consumedInputsAction is required when cancelling an in-progress order',
      );
    }

    if (
      input.consumedInputsAction &&
      !this.isValidConsumedInputsAction(input.consumedInputsAction)
    ) {
      throw new BadRequestException('Invalid consumedInputsAction');
    }

    const cancelMetadata: Record<string, string> = {
      reason,
      cancelledAt: new Date().toISOString(),
      cancelledBy,
    };
    if (input.consumedInputsAction) {
      cancelMetadata.consumedInputsAction = input.consumedInputsAction;
    }

    const notes = this.appendOrderMetadata(detail.notes, 'cancel', cancelMetadata);

    await this.plantRepository.updateOrder(tenantId, id, {
      status: ProductionOrderStatus.CANCELLED,
      notes,
    });

    const updated = await this.requireOrderDetail(tenantId, id);
    return this.mapOrderDetail(updated);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async requireWorkStation(tenantId: string, id: string): Promise<WorkStation> {
    const station = await this.plantRepository.findWorkStationById(tenantId, id);
    if (!station) {
      throw new NotFoundException(`Work station with ID "${id}" not found`);
    }
    return station;
  }

  private async requireRecipe(tenantId: string, id: string): Promise<ProductionRecipe> {
    const recipe = await this.plantRepository.findRecipeById(tenantId, id);
    if (!recipe) {
      throw new NotFoundException(`Production recipe with ID "${id}" not found`);
    }
    return recipe;
  }

  private async requirePhase(tenantId: string, id: string): Promise<ProductionPhase> {
    const phase = await this.plantRepository.findPhaseById(tenantId, id);
    if (!phase) {
      throw new NotFoundException(`Production phase with ID "${id}" not found`);
    }
    return phase;
  }

  private async requireOrderDetail(tenantId: string, id: string): Promise<OrderDetail> {
    const detail = await this.plantRepository.findOrderDetailById(tenantId, id);
    if (!detail) {
      throw new NotFoundException(`Production order with ID "${id}" not found`);
    }
    return detail;
  }

  private validateBatchCount(batchCount: number): void {
    if (!Number.isInteger(batchCount) || batchCount < 1) {
      throw new BadRequestException('batchCount must be a positive integer');
    }
  }

  private validateOrderDates(plannedStartAt: Date, plannedEndAt: Date): void {
    if (plannedStartAt >= plannedEndAt) {
      throw new BadRequestException('plannedStartAt must be before plannedEndAt');
    }
  }

  private parseCommitteeOrderSequence(number: string, committeeNumber: string): number | null {
    const trimmed = number.trim();
    if (!trimmed) {
      return null;
    }

    const escapedCommitteeNumber = committeeNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`^${escapedCommitteeNumber}-(\\d{2})$`, 'i').exec(trimmed);
    if (!match) {
      return null;
    }

    const seq = Number.parseInt(match[1], 10);
    return Number.isNaN(seq) ? null : seq;
  }

  private async generateOrderNumberForCommittee(
    tenantId: string,
    committeeId: string,
    committeeNumber: string,
  ): Promise<string> {
    const orders = await this.plantRepository.findOrders(tenantId, { committeeId });

    let maxSeq = 0;
    for (const order of orders) {
      const seq = this.parseCommitteeOrderSequence(order.number, committeeNumber);
      if (seq !== null && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const next = maxSeq + 1;
    if (next > 99) {
      throw new ConflictException(
        `Production order limit reached for committee ${committeeNumber} (99)`,
      );
    }

    return `${committeeNumber}-${String(next).padStart(2, '0')}`;
  }

  private mapOrderDetail(detail: OrderDetail): OrderDetailResponse {
    return {
      id: detail.id,
      tenantId: detail.tenantId,
      number: detail.number,
      recipeId: detail.recipeId,
      recipeName: detail.recipe.name,
      recipeVersion: detail.recipeVersion,
      status: detail.status,
      priority: detail.priority,
      shift: detail.shift,
      batchCount: detail.batchCount,
      plannedQuantity: detail.plannedQuantity.toString(),
      producedQuantity: detail.producedQuantity?.toString() ?? null,
      unit: detail.unit,
      plannedStartAt: detail.plannedStartAt,
      plannedEndAt: detail.plannedEndAt,
      actualStartAt: detail.actualStartAt,
      actualEndAt: detail.actualEndAt,
      supervisorId: detail.supervisorId,
      notes: detail.notes,
      lotNumber: detail.lotNumber,
      productionDate: detail.productionDate,
      deliveryDate: detail.deliveryDate,
      packageWeight: detail.recipe.packageWeight?.toString() ?? null,
      batchWeight: detail.batchWeight?.toString() ?? null,
      committeeId: detail.committeeId,
      committeeNumber: detail.committee?.number ?? null,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      materials: detail.materials.map((material) => ({
        id: material.id,
        supplyItemId: material.supplyItemId,
        materialName: material.materialName,
        lotNumber: material.lotNumber,
        requiredQuantity: material.requiredQuantity.toString(),
        consumedQuantity: material.consumedQuantity?.toString() ?? null,
        unit: material.unit,
        sortOrder: material.sortOrder,
      })),
      byproducts: detail.byproducts.map((byproduct) => ({
        id: byproduct.id,
        itemName: byproduct.itemName,
        unit: byproduct.unit,
        actualQuantity: byproduct.actualQuantity?.toString() ?? null,
        lotNumber: byproduct.lotNumber,
        expirationDate: byproduct.expirationDate,
      })),
      qualityChecks: detail.qualityChecks.map((check) => ({
        id: check.id,
        checkType: check.checkType,
        temperature: check.temperature,
        color: check.color,
        smell: check.smell,
        texture: check.texture,
        notes: check.notes,
      })),
      executions: detail.executions.map((execution) => ({
        id: execution.id,
        phaseId: execution.phaseId,
        phaseOrder: execution.phase.order,
        phaseName: execution.phase.name,
        requiresQA: execution.phase.requiresQA,
        workStationId: execution.workStationId,
        status: execution.status,
        plannedMinutes: execution.plannedMinutes,
        actualMinutes: execution.actualMinutes,
        producedQuantity: execution.producedQuantity?.toString() ?? null,
        qaApprovedAt: execution.qaApprovedAt,
        qaApprovedBy: execution.qaApprovedBy,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        operatorCount: execution.operatorCount,
        deliveredQuantity: execution.deliveredQuantity?.toString() ?? null,
        responsibleUserId: execution.responsibleUserId,
        responsibleName: null,
        notes: execution.notes,
      })),
      activeOperators: detail.activeSessions.map((session) => ({
        sessionId: session.id,
        operatorUserId: session.operatorUserId,
        workStationId: session.workStationId,
        phaseExecutionId: session.phaseExecutionId,
        startedAt: session.startedAt,
      })),
    };
  }

  private shouldEnsureMaterialSnapshot(detail: OrderDetail): boolean {
    if (detail.materials.length > 0) {
      return false;
    }

    return (
      detail.status === ProductionOrderStatus.PLANNED ||
      detail.status === ProductionOrderStatus.IN_PROCESS ||
      detail.status === ProductionOrderStatus.PAUSED ||
      detail.status === ProductionOrderStatus.COMPLETED
    );
  }

  private async createMaterialSnapshot(tenantId: string, order: OrderDetail): Promise<void> {
    const recipe = await this.plantRepository.findRecipeDetailById(tenantId, order.recipeId);
    if (!recipe) {
      throw new NotFoundException(`Production recipe with ID "${order.recipeId}" not found`);
    }

    const materials = await this.aggregateMaterialsFromRecipe(tenantId, recipe, order.batchCount);
    await this.plantRepository.replaceOrderMaterialsTx(tenantId, order.id, materials);
  }

  private async aggregateMaterialsFromRecipe(
    tenantId: string,
    recipe: RecipeWithPhasesAndInputs,
    batchCount: number,
  ): Promise<OrderMaterialSnapshotLine[]> {
    const aggregated = new Map<string, OrderMaterialSnapshotLine>();
    const nameCache = new Map<string, string>();
    let sortOrder = 0;

    for (const phase of recipe.phases) {
      for (const input of phase.inputs) {
        const requiredQuantity = new Decimal(input.quantityPerBatch).mul(batchCount);
        const existing = aggregated.get(input.supplyItemId);

        if (existing) {
          existing.requiredQuantity = existing.requiredQuantity.add(requiredQuantity);
          continue;
        }

        let materialName = nameCache.get(input.supplyItemId);
        if (!materialName) {
          materialName = await this.resolveSupplyItemName(tenantId, input.supplyItemId);
          nameCache.set(input.supplyItemId, materialName);
        }

        aggregated.set(input.supplyItemId, {
          supplyItemId: input.supplyItemId,
          materialName,
          requiredQuantity,
          unit: input.unit,
          sortOrder: sortOrder++,
        });
      }
    }

    return Array.from(aggregated.values()).sort((left, right) => left.sortOrder - right.sortOrder);
  }

  private async resolveSupplyItemName(tenantId: string, supplyItemId: string): Promise<string> {
    try {
      const item = await this.supplyItemsService.findOne(tenantId, supplyItemId);
      return item.nombre;
    } catch {
      return supplyItemId;
    }
  }

  private appendOrderMetadata(
    notes: string | null,
    key: string,
    value: Record<string, string>,
  ): string {
    let parsed: Record<string, unknown> = {};

    if (notes) {
      try {
        const existing = JSON.parse(notes) as unknown;
        if (typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
          parsed = existing as Record<string, unknown>;
        } else {
          parsed = { userNotes: notes };
        }
      } catch {
        parsed = { userNotes: notes };
      }
    }

    parsed[key] = value;
    return JSON.stringify(parsed);
  }

  private isValidConsumedInputsAction(action: ConsumedInputsAction): boolean {
    return Object.values(ConsumedInputsAction).includes(action);
  }

  private validateReorderItems(phases: ProductionPhase[], items: ReorderPhaseItem[]): void {
    if (items.length !== phases.length) {
      throw new BadRequestException('Reorder must include every phase exactly once');
    }

    const phaseIds = new Set(phases.map((phase) => phase.id));
    const newOrders: number[] = [];

    for (const item of items) {
      if (!phaseIds.has(item.phaseId)) {
        throw new BadRequestException(
          `Phase with ID "${item.phaseId}" does not belong to this recipe`,
        );
      }
      newOrders.push(item.newOrder);
    }

    if (new Set(newOrders).size !== newOrders.length) {
      throw new BadRequestException('newOrder values must be unique');
    }

    const expectedOrders = new Set(Array.from({ length: phases.length }, (_, index) => index + 1));
    for (const order of newOrders) {
      if (!expectedOrders.has(order)) {
        throw new BadRequestException(
          `newOrder values must be a contiguous sequence from 1 to ${phases.length}`,
        );
      }
    }
  }

  private assertUniquePhaseOrders(phases: CreatePhaseNestedInput[]): void {
    const orders = phases.map((p) => p.order);
    if (new Set(orders).size !== orders.length) {
      throw new BadRequestException('Phase order values must be unique within the recipe');
    }
  }

  private async validateNestedPhases(
    tenantId: string,
    phases: CreatePhaseNestedInput[],
  ): Promise<void> {
    this.assertUniquePhaseOrders(phases);

    for (const phase of phases) {
      const minOperators = phase.minOperators ?? 1;
      const maxOperators = phase.maxOperators ?? 4;
      if (minOperators > maxOperators) {
        throw new BadRequestException(
          `Phase "${phase.name}": minOperators cannot exceed maxOperators`,
        );
      }

      const station = await this.plantRepository.findWorkStationById(tenantId, phase.workStationId);
      if (!station) {
        throw new NotFoundException(`Work station with ID "${phase.workStationId}" not found`);
      }
      if (!station.isActive) {
        throw new BadRequestException(
          `Work station "${station.code}" is inactive and cannot be assigned to a phase`,
        );
      }

      for (const phaseInput of phase.inputs ?? []) {
        await this.supplyItemsService.findOne(tenantId, phaseInput.supplyItemId);
      }
    }
  }

  private buildCreateRecipeTxInput(
    tenantId: string,
    input: CreateRecipeWithPhasesInput,
    version: number,
    deactivateRecipeId?: string,
  ): CreateRecipeWithPhasesTxInput {
    return {
      tenantId,
      deactivateRecipeId,
      recipe: {
        name: input.name,
        categoryId: input.categoryId ?? null,
        finishedProductId: input.finishedProductId,
        batchSize: input.batchSize,
        batchUnit: input.batchUnit,
        packageWeight: input.packageWeight ?? null,
        estimatedMinutes: input.estimatedMinutes,
        version,
        notes: input.notes ?? null,
        isActive: input.isActive ?? true,
      },
      phases: input.phases.map((phase) => ({
        order: phase.order,
        name: phase.name,
        description: phase.description ?? null,
        workStationId: phase.workStationId,
        standardMinutes: phase.standardMinutes,
        minOperators: phase.minOperators ?? 1,
        maxOperators: phase.maxOperators ?? 4,
        requiresQA: phase.requiresQA ?? false,
        inputs: (phase.inputs ?? []).map((item) => ({
          supplyItemId: item.supplyItemId,
          quantityPerBatch: item.quantityPerBatch,
          unit: item.unit,
          isOptional: item.isOptional ?? false,
        })),
      })),
    };
  }

  private async resolveCategoryId(
    tenantId: string,
    categoryId?: string | null,
  ): Promise<string | null> {
    if (!categoryId) {
      return null;
    }
    await this.recipeCategoriesService.findOne(tenantId, categoryId);
    return categoryId;
  }

  private toCreatePhaseOnRecipeData(input: CreatePhaseNestedInput): CreatePhaseOnRecipeData {
    return {
      order: input.order,
      name: input.name,
      description: input.description ?? null,
      workStationId: input.workStationId,
      standardMinutes: input.standardMinutes,
      minOperators: input.minOperators ?? 1,
      maxOperators: input.maxOperators ?? 4,
      requiresQA: input.requiresQA ?? false,
      inputs: (input.inputs ?? []).map((item) => ({
        supplyItemId: item.supplyItemId,
        quantityPerBatch: item.quantityPerBatch,
        unit: item.unit,
        isOptional: item.isOptional ?? false,
      })),
    };
  }
}
