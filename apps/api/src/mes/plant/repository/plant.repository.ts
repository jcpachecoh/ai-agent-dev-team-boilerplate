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
  CreatePhaseOnRecipeData,
  CreateRecipeWithPhasesTxInput,
  CreateWorkStationData,
  IPlantRepository,
  ListOrdersFilters,
  OrderDetail,
  OrderListRow,
  OrderMaterialSnapshotLine,
  OrderWithExecutions,
  RecipeWithPhasesAndInputs,
  ReorderPhaseItem,
  UpdateExecutionData,
  UpdateOrderData,
  UpdatePhaseInput,
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

  findAllRecipes(tenantId: string) {
    return this.prisma.productionRecipe.findMany({
      where: { tenantId },
      include: {
        category: { select: { id: true, nombre: true } },
      },
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

  findRecipeByCategoryAndName(
    tenantId: string,
    categoryId: string,
    name: string,
  ): Promise<ProductionRecipe | null> {
    return this.prisma.productionRecipe.findFirst({
      where: { tenantId, categoryId, name },
    });
  }

  async previewNextRecipeCode(tenantId: string, categoryId: string): Promise<string> {
    const category = await this.prisma.recipeCategory.findFirst({
      where: { id: categoryId, tenantId, isActive: true },
      select: { codePrefix: true, codeSequence: true },
    });
    if (!category) {
      return '';
    }
    const next = category.codeSequence + 1;
    return `${category.codePrefix}-${String(next).padStart(4, '0')}`;
  }

  findRecipeStatusHistory(tenantId: string, recipeId: string) {
    return this.prisma.recipeStatusHistory.findMany({
      where: { tenantId, recipeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createRecipeStatusHistory(data: {
    tenantId: string;
    recipeId: string;
    fromStatus: import('@prisma/client').RecipeLifecycleStatus | null;
    toStatus: import('@prisma/client').RecipeLifecycleStatus;
    changedByUserId?: string | null;
    reason?: string | null;
  }) {
    return this.prisma.recipeStatusHistory.create({ data });
  }

  findRecipeDetailById(tenantId: string, id: string): Promise<RecipeWithPhasesAndInputs | null> {
    return this.prisma.productionRecipe.findFirst({
      where: { id, tenantId },
      include: {
        category: { select: { id: true, nombre: true, codePrefix: true } },
        locations: { include: { location: { select: { id: true, name: true } } } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
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
          data: { isActive: false, lifecycleStatus: 'INACTIVE' },
        });
      }

      const category = await tx.recipeCategory.update({
        where: { id: input.recipe.categoryId, tenantId: input.tenantId },
        data: { codeSequence: { increment: 1 } },
      });
      const code =
        input.recipe.code ??
        `${category.codePrefix}-${String(category.codeSequence).padStart(4, '0')}`;

      const recipe = await tx.productionRecipe.create({
        data: {
          tenantId: input.tenantId,
          name: input.recipe.name,
          code,
          categoryId: input.recipe.categoryId,
          recipeType: input.recipe.recipeType,
          finishedProductId: input.recipe.finishedProductId ?? null,
          batchSize: input.recipe.batchSize,
          batchUnit: input.recipe.batchUnit,
          batchDisplayUnit: input.recipe.batchDisplayUnit ?? null,
          packageWeight: input.recipe.packageWeight ?? null,
          packageWeightGrams: input.recipe.packageWeightGrams ?? null,
          expectedYield: input.recipe.expectedYield ?? null,
          expectedYieldUnit: input.recipe.expectedYieldUnit ?? null,
          estimatedMinutes: input.recipe.estimatedMinutes,
          operationCenter: input.recipe.operationCenter,
          technicalResponsible: input.recipe.technicalResponsible,
          allergens: input.recipe.allergens ?? [],
          version: input.recipe.version,
          notes: input.recipe.notes ?? null,
          isDraft: input.recipe.isDraft ?? false,
          lifecycleStatus: input.recipe.lifecycleStatus ?? 'TRIAL',
          isActive: input.recipe.isActive ?? false,
        },
      });

      await tx.recipeStatusHistory.create({
        data: {
          tenantId: input.tenantId,
          recipeId: recipe.id,
          fromStatus: null,
          toStatus: input.recipe.lifecycleStatus ?? 'TRIAL',
          changedByUserId: input.actorUserId ?? null,
        },
      });

      if (input.locationIds?.length) {
        await tx.productionRecipeLocation.createMany({
          data: input.locationIds.map((locationId) => ({
            tenantId: input.tenantId,
            recipeId: recipe.id,
            locationId,
          })),
        });
      }

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
    const { locationIds, ...recipeData } = data;

    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.productionRecipe.update({
        where: { id },
        data: recipeData,
      });

      if (locationIds !== undefined) {
        await tx.productionRecipeLocation.deleteMany({
          where: { recipeId: id, tenantId },
        });

        if (locationIds.length > 0) {
          await tx.productionRecipeLocation.createMany({
            data: locationIds.map((locationId) => ({
              tenantId,
              recipeId: id,
              locationId,
            })),
          });
        }
      } else if (
        recipeData.operationCenter !== undefined &&
        recipeData.operationCenter !== 'LOCATION'
      ) {
        await tx.productionRecipeLocation.deleteMany({
          where: { recipeId: id, tenantId },
        });
      }

      return recipe;
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
      categoryId?: string | null;
      finishedProductId: string;
      batchSize: Decimal;
      batchUnit: StockUnit;
      packageWeight?: Decimal | null;
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

      const categoryId = newRecipeData.categoryId ?? source.categoryId;
      let code = source.code ? `${source.code}-COPY` : null;
      if (categoryId) {
        const category = await tx.recipeCategory.update({
          where: { id: categoryId, tenantId },
          data: { codeSequence: { increment: 1 } },
        });
        code = `${category.codePrefix}-${String(category.codeSequence).padStart(4, '0')}`;
      }

      const recipe = await tx.productionRecipe.create({
        data: {
          tenantId,
          name: newRecipeData.name,
          code,
          categoryId,
          recipeType: source.recipeType,
          finishedProductId: newRecipeData.finishedProductId,
          batchSize: newRecipeData.batchSize,
          batchUnit: newRecipeData.batchUnit,
          batchDisplayUnit: source.batchDisplayUnit,
          packageWeight: newRecipeData.packageWeight ?? source.packageWeight,
          packageWeightGrams: source.packageWeightGrams,
          expectedYield: source.expectedYield,
          expectedYieldUnit: source.expectedYieldUnit,
          estimatedMinutes: newRecipeData.estimatedMinutes,
          operationCenter: source.operationCenter,
          technicalResponsible: source.technicalResponsible,
          allergens: source.allergens,
          version: newRecipeData.version,
          notes: newRecipeData.notes ?? null,
          lifecycleStatus: 'TRIAL',
          isActive: false,
          isDraft: false,
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

  async createPhaseWithInputsTx(
    tenantId: string,
    recipeId: string,
    phase: CreatePhaseOnRecipeData,
  ): Promise<ProductionPhase> {
    return this.prisma.$transaction(async (tx) => {
      const createdPhase = await tx.productionPhase.create({
        data: {
          tenantId,
          recipeId,
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
            tenantId,
            phaseId: createdPhase.id,
            supplyItemId: phaseInput.supplyItemId,
            quantityPerBatch: phaseInput.quantityPerBatch,
            unit: phaseInput.unit,
            isOptional: phaseInput.isOptional,
          },
        });
      }

      return createdPhase;
    });
  }

  updatePhase(tenantId: string, id: string, data: UpdatePhaseInput): Promise<ProductionPhase> {
    const { inputs: _inputs, ...phaseData } = data;
    return this.prisma.productionPhase.update({
      where: { id },
      data: phaseData,
    });
  }

  async replacePhaseInputsTx(
    tenantId: string,
    phaseId: string,
    inputs: CreatePhaseOnRecipeData['inputs'],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.phaseInput.deleteMany({
        where: { phaseId, tenantId },
      });

      for (const phaseInput of inputs) {
        await tx.phaseInput.create({
          data: {
            tenantId,
            phaseId,
            supplyItemId: phaseInput.supplyItemId,
            quantityPerBatch: phaseInput.quantityPerBatch,
            unit: phaseInput.unit,
            isOptional: phaseInput.isOptional,
          },
        });
      }
    });
  }

  countPhaseExecutions(tenantId: string, phaseId: string): Promise<number> {
    return this.prisma.phaseExecution.count({
      where: { phaseId, tenantId },
    });
  }

  async deletePhase(tenantId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.phaseInput.deleteMany({
        where: { phaseId: id, tenantId },
      });
      await tx.productionPhase.delete({
        where: { id },
      });
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
          committeeId: input.committeeId,
          status: ProductionOrderStatus.DRAFT,
        },
      });

      await tx.productionCommittee.update({
        where: { id: input.committeeId },
        data: { ordersCount: { increment: 1 } },
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

  findOrders(tenantId: string, filters: ListOrdersFilters): Promise<OrderListRow[]> {
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
        ...(filters.committeeId ? { committeeId: filters.committeeId } : {}),
        ...(plannedStartAt ? { plannedStartAt } : {}),
      },
      include: {
        committee: { select: { id: true, number: true } },
      },
      orderBy: { plannedStartAt: 'desc' },
    });
  }

  async findOrderDetailById(tenantId: string, id: string): Promise<OrderDetail | null> {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId },
      include: {
        recipe: { select: { id: true, name: true, packageWeight: true } },
        committee: { select: { id: true, number: true } },
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
        materials: { orderBy: { sortOrder: 'asc' } },
        byproducts: true,
        qualityChecks: true,
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
      materials: order.materials,
      byproducts: order.byproducts,
      qualityChecks: order.qualityChecks,
    };
  }

  async replaceOrderMaterialsTx(
    tenantId: string,
    orderId: string,
    materials: OrderMaterialSnapshotLine[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.productionOrderMaterial.deleteMany({
        where: { tenantId, orderId },
      });

      if (materials.length === 0) {
        return;
      }

      await tx.productionOrderMaterial.createMany({
        data: materials.map((material) => ({
          tenantId,
          orderId,
          supplyItemId: material.supplyItemId,
          materialName: material.materialName,
          requiredQuantity: material.requiredQuantity,
          unit: material.unit,
          sortOrder: material.sortOrder,
        })),
      });
    });
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

  findSupplyItemsWithPrincipalSupplier(
    tenantId: string,
    supplyItemIds: string[],
  ): Promise<
    Array<{
      id: string;
      nombre: string;
      stockActualBodega: Decimal;
      supplierProducts: Array<{ supplier: { razonSocial: string } }>;
    }>
  > {
    if (supplyItemIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.supplyItem.findMany({
      where: { tenantId, id: { in: supplyItemIds } },
      select: {
        id: true,
        nombre: true,
        stockActualBodega: true,
        supplierProducts: {
          where: { esProveedorPrincipal: true },
          select: { supplier: { select: { razonSocial: true } } },
          take: 1,
        },
      },
    });
  }
}
