import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PhaseInput, ProductionPhase, ProductionRecipe, WorkStation } from '@prisma/client';
import { SupplyItemsService } from '../../../supplyitems/service/supplyitems.service';
import { PlantRepository } from '../repository/plant.repository';
import type {
  CreatePhaseInputInput,
  CreatePhaseNestedInput,
  CreateRecipeWithPhasesInput,
  CreateRecipeWithPhasesTxInput,
  CreateWorkStationInput,
  IPlantService,
  RecipeDetailResponse,
  ReorderPhaseItem,
  UpdateRecipeInput,
  UpdateWorkStationInput,
} from '../interfaces/plant.interfaces';

@Injectable()
export class PlantService implements IPlantService {
  constructor(
    private readonly plantRepository: PlantRepository,
    private readonly supplyItemsService: SupplyItemsService,
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
      finishedProductId: source.finishedProductId,
      batchSize: source.batchSize,
      batchUnit: source.batchUnit,
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
        finishedProductId: input.finishedProductId,
        batchSize: input.batchSize,
        batchUnit: input.batchUnit,
        estimatedMinutes: input.estimatedMinutes,
        version,
        notes: input.notes ?? null,
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
}
