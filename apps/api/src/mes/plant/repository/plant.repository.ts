import { Injectable } from '@nestjs/common';
import {
  PhaseExecutionStatus,
  ProductionOrderStatus,
  type PhaseExecution,
  type PhaseInput,
  type ProductionOrder,
  type ProductionPhase,
  type ProductionRecipe,
  type WorkStation,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateOrderWithExecutionsTxInput,
  CreatePhaseInputData,
  CreateRecipeWithPhasesTxInput,
  CreateWorkStationData,
  IPlantRepository,
  ListOrdersFilters,
  OrderDetail,
  OrderWithExecutions,
  RecipeWithPhasesAndInputs,
  ReorderPhaseItem,
  UpdateExecutionData,
  UpdateOrderData,
  UpdateRecipeInput,
  UpdateWorkStationData,
} from '../interfaces/plant.interfaces';
import type { Decimal } from '@prisma/client/runtime/library';
import type { StockUnit } from '@prisma/client';

@Injectable()
export class PlantRepository implements IPlantRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Workstations ───────────────────────────────────────────────────────────

  findAllWorkStations(tenantId: string): Promise<WorkStation[]> {
    return this.prisma.workStation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findWorkStationById(tenantId: string, id: string): Promise<WorkStation | null> {
    return this.prisma.workStation.findFirst({
      where: { id, tenantId },
    });
  }

  findWorkStationByCode(tenantId: string, code: string): Promise<WorkStation | null> {
    return this.prisma.workStation.findFirst({
      where: { tenantId, code },
    });
  }

  createWorkStation(data: CreateWorkStationData): Promise<WorkStation> {
    return this.prisma.workStation.create({ data });
  }

  updateWorkStation(
    tenantId: string,
    id: string,
    data: UpdateWorkStationData,
  ): Promise<WorkStation> {
    return this.prisma.workStation.update({
      where: { id },
      data,
    });
  }

  softDeleteWorkStation(tenantId: string, id: string): Promise<WorkStation> {
    return this.prisma.workStation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hasActiveExecutionsForWorkStation(
    tenantId: string,
    workStationId: string,
  ): Promise<boolean> {
    const execution = await this.prisma.phaseExecution.findFirst({
      where: {
        tenantId,
        workStationId,
        status: { not: PhaseExecutionStatus.COMPLETED },
      },
    });
    return execution !== null;
  }

  // ── Recipes ────────────────────────────────────────────────────────────────

  findAllRecipes(tenantId: string): Promise<ProductionRecipe[]> {
    return this.prisma.productionRecipe.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  findRecipeById(tenantId: string, id: string): Promise<ProductionRecipe | null> {
    return this.prisma.productionRecipe.findFirst({
      where: { id, tenantId },
    });
  }

  findActiveRecipeByName(tenantId: string, name: string): Promise<ProductionRecipe | null> {
    return this.prisma.productionRecipe.findFirst({
      where: { tenantId, name, isActive: true },
    });
  }

  findRecipeDetailById(tenantId: string, id: string): Promise<RecipeWithPhasesAndInputs | null> {
    return this.prisma.productionRecipe.findFirst({
      where: { id, tenantId },
      include: {
        phases: {
          orderBy: { order: 'asc' },
          include: { inputs: true },
        },
      },
    });
  }

  async createRecipeWithPhasesTx(input: CreateRecipeWithPhasesTxInput): Promise<ProductionRecipe> {
    return this.prisma.$transaction(async (tx) => {
      if (input.deactivateRecipeId) {
        await tx.productionRecipe.update({
          where: { id: input.deactivateRecipeId },
          data: { isActive: false },
        });
      }

      const recipe = await tx.productionRecipe.create({
        data: {
          tenantId: input.tenantId,
          name: input.recipe.name,
          finishedProductId: input.recipe.finishedProductId,
          batchSize: input.recipe.batchSize,
          batchUnit: input.recipe.batchUnit,
          estimatedMinutes: input.recipe.estimatedMinutes,
          version: input.recipe.version,
          notes: input.recipe.notes ?? null,
        },
      });

      for (const phase of input.phases) {
        const createdPhase = await tx.productionPhase.create({
          data: {
            tenantId: input.tenantId,
            recipeId: recipe.id,
            workStationId: phase.workStationId,
            order: phase.order,
            name: phase.name,
            description: phase.description ?? null,
            standardMinutes: phase.standardMinutes,
            minOperators: phase.minOperators,
            maxOperators: phase.maxOperators,
            requiresQA: phase.requiresQA,
          },
        });

        for (const phaseInput of phase.inputs) {
          await tx.phaseInput.create({
            data: {
              tenantId: input.tenantId,
              phaseId: createdPhase.id,
              supplyItemId: phaseInput.supplyItemId,
              quantityPerBatch: phaseInput.quantityPerBatch,
              unit: phaseInput.unit,
              isOptional: phaseInput.isOptional,
            },
          });
        }
      }

      return recipe;
    });
  }

  updateRecipe(tenantId: string, id: string, data: UpdateRecipeInput): Promise<ProductionRecipe> {
    return this.prisma.productionRecipe.update({
      where: { id },
      data,
    });
  }

  softDeleteRecipe(tenantId: string, id: string): Promise<ProductionRecipe> {
    return this.prisma.productionRecipe.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async cloneRecipeTx(
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
  ): Promise<ProductionRecipe> {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.productionRecipe.findFirst({
        where: { id: sourceRecipeId, tenantId },
        include: {
          phases: {
            orderBy: { order: 'asc' },
            include: { inputs: true },
          },
        },
      });

      if (!source) {
        throw new Error(`Source recipe not found: ${sourceRecipeId}`);
      }

      const recipe = await tx.productionRecipe.create({
        data: {
          tenantId,
          name: newRecipeData.name,
          finishedProductId: newRecipeData.finishedProductId,
          batchSize: newRecipeData.batchSize,
          batchUnit: newRecipeData.batchUnit,
          estimatedMinutes: newRecipeData.estimatedMinutes,
          version: newRecipeData.version,
          notes: newRecipeData.notes ?? null,
        },
      });

      for (const phase of source.phases) {
        const createdPhase = await tx.productionPhase.create({
          data: {
            tenantId,
            recipeId: recipe.id,
            workStationId: phase.workStationId,
            order: phase.order,
            name: phase.name,
            description: phase.description,
            standardMinutes: phase.standardMinutes,
            minOperators: phase.minOperators,
            maxOperators: phase.maxOperators,
            requiresQA: phase.requiresQA,
          },
        });

        for (const input of phase.inputs) {
          await tx.phaseInput.create({
            data: {
              tenantId,
              phaseId: createdPhase.id,
              supplyItemId: input.supplyItemId,
              quantityPerBatch: input.quantityPerBatch,
              unit: input.unit,
              isOptional: input.isOptional,
            },
          });
        }
      }

      return recipe;
    });
  }

  // ── Phases ───────────────────────────────────────────────────────────────

  findPhaseById(tenantId: string, id: string): Promise<ProductionPhase | null> {
    return this.prisma.productionPhase.findFirst({
      where: { id, tenantId },
    });
  }

  findPhasesByRecipeId(tenantId: string, recipeId: string): Promise<ProductionPhase[]> {
    return this.prisma.productionPhase.findMany({
      where: { tenantId, recipeId },
      orderBy: { order: 'asc' },
    });
  }

  async reorderPhasesTx(
    tenantId: string,
    recipeId: string,
    items: ReorderPhaseItem[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.productionPhase.updateMany({
          where: { id: item.phaseId, recipeId, tenantId },
          data: { order: item.newOrder },
        });
      }
    });
  }

  // ── Phase inputs ─────────────────────────────────────────────────────────

  findPhaseInputById(tenantId: string, id: string): Promise<PhaseInput | null> {
    return this.prisma.phaseInput.findFirst({
      where: { id, tenantId },
    });
  }

  createPhaseInput(data: CreatePhaseInputData): Promise<PhaseInput> {
    return this.prisma.phaseInput.create({
      data: {
        tenantId: data.tenantId,
        phaseId: data.phaseId,
        supplyItemId: data.supplyItemId,
        quantityPerBatch: data.quantityPerBatch,
        unit: data.unit,
        isOptional: data.isOptional ?? false,
      },
    });
  }

  async deletePhaseInput(tenantId: string, phaseId: string, inputId: string): Promise<PhaseInput> {
    const existing = await this.prisma.phaseInput.findFirst({
      where: { id: inputId, phaseId, tenantId },
    });
    if (!existing) {
      throw new Error(`Phase input not found: ${inputId}`);
    }
    return this.prisma.phaseInput.delete({
      where: { id: inputId },
    });
  }

  // ── Production orders ──────────────────────────────────────────────────────

  async createOrderWithExecutionsTx(
    input: CreateOrderWithExecutionsTxInput,
  ): Promise<OrderWithExecutions> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.productionOrder.create({
        data: {
          tenantId: input.tenantId,
          number: input.number,
          recipeId: input.recipeId,
          recipeVersion: input.recipeVersion,
          batchCount: input.batchCount,
          shift: input.shift,
          priority: input.priority,
          plannedQuantity: input.plannedQuantity,
          unit: input.unit,
          plannedStartAt: input.plannedStartAt,
          plannedEndAt: input.plannedEndAt,
          supervisorId: input.supervisorId ?? null,
          notes: input.notes ?? null,
          status: ProductionOrderStatus.DRAFT,
        },
      });

      const phases = await tx.productionPhase.findMany({
        where: { tenantId: input.tenantId, recipeId: input.recipeId },
        orderBy: { order: 'asc' },
      });

      const executions: PhaseExecution[] = [];
      for (const phase of phases) {
        const execution = await tx.phaseExecution.create({
          data: {
            tenantId: input.tenantId,
            orderId: order.id,
            phaseId: phase.id,
            workStationId: phase.workStationId,
            status: PhaseExecutionStatus.PENDING,
            plannedMinutes: phase.standardMinutes * input.batchCount,
          },
        });
        executions.push(execution);
      }

      return { order, executions };
    });
  }

  findOrders(tenantId: string, filters: ListOrdersFilters): Promise<ProductionOrder[]> {
    const plannedStartAt =
      filters.plannedStartFrom || filters.plannedStartTo
        ? {
            ...(filters.plannedStartFrom ? { gte: filters.plannedStartFrom } : {}),
            ...(filters.plannedStartTo ? { lte: filters.plannedStartTo } : {}),
          }
        : undefined;

    return this.prisma.productionOrder.findMany({
      where: {
        tenantId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.shift ? { shift: filters.shift } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(plannedStartAt ? { plannedStartAt } : {}),
      },
      orderBy: { plannedStartAt: 'desc' },
    });
  }

  async findOrderDetailById(tenantId: string, id: string): Promise<OrderDetail | null> {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId },
      include: {
        recipe: { select: { id: true, name: true } },
        executions: {
          orderBy: { phase: { order: 'asc' } },
          include: {
            phase: {
              select: {
                id: true,
                order: true,
                name: true,
                requiresQA: true,
                workStationId: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    const activeSessions = await this.prisma.operatorSession.findMany({
      where: {
        tenantId,
        endedAt: null,
        phaseExecution: { orderId: id, tenantId },
      },
      select: {
        id: true,
        workStationId: true,
        operatorUserId: true,
        phaseExecutionId: true,
        startedAt: true,
      },
    });

    return {
      ...order,
      recipe: order.recipe,
      executions: order.executions,
      activeSessions,
    };
  }

  async updateOrder(tenantId: string, id: string, data: UpdateOrderData): Promise<ProductionOrder> {
    const existing = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new Error(`Production order not found: ${id}`);
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data,
    });
  }

  findExecutionById(tenantId: string, id: string): Promise<PhaseExecution | null> {
    return this.prisma.phaseExecution.findFirst({
      where: { id, tenantId },
    });
  }

  async updateExecution(
    tenantId: string,
    id: string,
    data: UpdateExecutionData,
  ): Promise<PhaseExecution> {
    const existing = await this.prisma.phaseExecution.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new Error(`Phase execution not found: ${id}`);
    }

    return this.prisma.phaseExecution.update({
      where: { id },
      data,
    });
  }
}
