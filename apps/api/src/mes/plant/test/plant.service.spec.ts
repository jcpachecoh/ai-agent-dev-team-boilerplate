import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PhaseExecutionStatus,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
  StockUnit,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SupplyItemsService } from '../../../supplyitems/service/supplyitems.service';
import { PlantRepository } from '../repository/plant.repository';
import { PlantEventsService } from '../service/plant-events.service';
import { PlantService } from '../service/plant.service';
import type { CreateRecipeWithPhasesInput } from '../interfaces/plant.interfaces';
import { ConsumedInputsAction } from '../interfaces/plant.interfaces';

const tenantId = 'palos-de-lena';

const mockWorkStation = {
  id: 'ws-1',
  tenantId,
  name: 'Línea 1',
  code: 'LINE-01',
  description: null,
  location: null,
  isActive: true,
  createdAt: new Date(),
};

const mockRecipe = {
  id: 'recipe-1',
  tenantId,
  name: 'Pan integral',
  finishedProductId: 'prod-1',
  batchSize: new Decimal('10'),
  batchUnit: StockUnit.UNIT,
  estimatedMinutes: 60,
  version: 1,
  isActive: true,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createRecipeInput: CreateRecipeWithPhasesInput = {
  name: 'Pan integral',
  finishedProductId: 'prod-1',
  batchSize: new Decimal('10'),
  batchUnit: StockUnit.UNIT,
  estimatedMinutes: 60,
  phases: [
    {
      order: 1,
      name: 'Mezclado',
      workStationId: 'ws-1',
      standardMinutes: 15,
      inputs: [],
    },
  ],
};

const repoMock = {
  findWorkStationByCode: jest.fn(),
  findWorkStationById: jest.fn(),
  findAllWorkStations: jest.fn(),
  createWorkStation: jest.fn(),
  updateWorkStation: jest.fn(),
  softDeleteWorkStation: jest.fn(),
  hasActiveExecutionsForWorkStation: jest.fn(),
  findAllRecipes: jest.fn(),
  findRecipeById: jest.fn(),
  findActiveRecipeByName: jest.fn(),
  findRecipeDetailById: jest.fn(),
  createRecipeWithPhasesTx: jest.fn(),
  updateRecipe: jest.fn(),
  softDeleteRecipe: jest.fn(),
  cloneRecipeTx: jest.fn(),
  findPhaseById: jest.fn(),
  findPhasesByRecipeId: jest.fn(),
  reorderPhasesTx: jest.fn(),
  findPhaseInputById: jest.fn(),
  createPhaseInput: jest.fn(),
  deletePhaseInput: jest.fn(),
  createOrderWithExecutionsTx: jest.fn(),
  findOrders: jest.fn(),
  findOrderDetailById: jest.fn(),
  updateOrder: jest.fn(),
  updateExecution: jest.fn(),
};

const supplyItemsServiceMock = {
  findOne: jest.fn(),
};

const plantEventsServiceMock = {
  emitPhaseStatusChanges: jest.fn(),
  emitPhaseStatusChanged: jest.fn(),
};

describe('PlantService', () => {
  let service: PlantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantService,
        { provide: PlantRepository, useValue: repoMock },
        { provide: SupplyItemsService, useValue: supplyItemsServiceMock },
        { provide: PlantEventsService, useValue: plantEventsServiceMock },
      ],
    }).compile();

    service = module.get<PlantService>(PlantService);
    jest.clearAllMocks();
  });

  describe('createRecipe', () => {
    beforeEach(() => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      repoMock.createRecipeWithPhasesTx.mockResolvedValue(mockRecipe);
    });

    it('calls createRecipeWithPhasesTx once when no prior active recipe exists', async () => {
      repoMock.findActiveRecipeByName.mockResolvedValue(null);

      const result = await service.createRecipe(tenantId, createRecipeInput);

      expect(result).toEqual(mockRecipe);
      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledTimes(1);
      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          deactivateRecipeId: undefined,
          recipe: expect.objectContaining({ version: 1 }),
        }),
      );
    });

    it('deactivates prior active recipe and increments version when name exists', async () => {
      repoMock.findActiveRecipeByName.mockResolvedValue({
        ...mockRecipe,
        id: 'recipe-old',
        version: 2,
      });

      await service.createRecipe(tenantId, createRecipeInput);

      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledWith(
        expect.objectContaining({
          deactivateRecipeId: 'recipe-old',
          recipe: expect.objectContaining({ version: 3 }),
        }),
      );
    });
  });

  describe('findRecipeById', () => {
    it('returns totalStandardMinutes as sum of phase standardMinutes', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue({
        ...mockRecipe,
        phases: [
          {
            id: 'phase-1',
            tenantId,
            recipeId: 'recipe-1',
            workStationId: 'ws-1',
            order: 1,
            name: 'A',
            description: null,
            standardMinutes: 10,
            minOperators: 1,
            maxOperators: 4,
            requiresQA: false,
            inputs: [],
          },
          {
            id: 'phase-2',
            tenantId,
            recipeId: 'recipe-1',
            workStationId: 'ws-1',
            order: 2,
            name: 'B',
            description: null,
            standardMinutes: 25,
            minOperators: 1,
            maxOperators: 4,
            requiresQA: false,
            inputs: [],
          },
        ],
      });

      const result = await service.findRecipeById(tenantId, 'recipe-1');

      expect(result.totalStandardMinutes).toBe(35);
    });

    it('throws NotFoundException when recipe is missing', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(null);

      await expect(service.findRecipeById(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteWorkStation', () => {
    it('throws ConflictException when station has active executions', async () => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      repoMock.hasActiveExecutionsForWorkStation.mockResolvedValue(true);

      await expect(service.softDeleteWorkStation(tenantId, 'ws-1')).rejects.toThrow(
        ConflictException,
      );
      expect(repoMock.softDeleteWorkStation).not.toHaveBeenCalled();
    });

    it('soft-deletes when no active executions', async () => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      repoMock.hasActiveExecutionsForWorkStation.mockResolvedValue(false);
      repoMock.softDeleteWorkStation.mockResolvedValue({
        ...mockWorkStation,
        isActive: false,
      });

      const result = await service.softDeleteWorkStation(tenantId, 'ws-1');

      expect(result.isActive).toBe(false);
      expect(repoMock.softDeleteWorkStation).toHaveBeenCalledWith(tenantId, 'ws-1');
    });
  });

  describe('reorderPhases', () => {
    const reorderItems = [
      { phaseId: 'phase-1', newOrder: 2 },
      { phaseId: 'phase-2', newOrder: 1 },
    ];

    beforeEach(() => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.findPhasesByRecipeId.mockResolvedValue([
        { id: 'phase-1', order: 1 },
        { id: 'phase-2', order: 2 },
      ]);
    });

    it('calls reorderPhasesTx with validated items', async () => {
      await service.reorderPhases(tenantId, 'recipe-1', reorderItems);

      expect(repoMock.reorderPhasesTx).toHaveBeenCalledWith(tenantId, 'recipe-1', reorderItems);
    });

    it('throws BadRequestException when phaseId does not belong to recipe', async () => {
      await expect(
        service.reorderPhases(tenantId, 'recipe-1', [
          { phaseId: 'unknown-phase', newOrder: 1 },
          { phaseId: 'phase-2', newOrder: 2 },
        ]),
      ).rejects.toThrow(BadRequestException);

      expect(repoMock.reorderPhasesTx).not.toHaveBeenCalled();
    });
  });

  describe('createWorkStation', () => {
    it('throws ConflictException when code already exists', async () => {
      repoMock.findWorkStationByCode.mockResolvedValue(mockWorkStation);

      await expect(
        service.createWorkStation(tenantId, {
          name: 'Duplicate',
          code: 'LINE-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates work station when code is available', async () => {
      repoMock.findWorkStationByCode.mockResolvedValue(null);
      repoMock.createWorkStation.mockResolvedValue(mockWorkStation);

      const result = await service.createWorkStation(tenantId, {
        name: 'Línea 1',
        code: 'LINE-01',
      });

      expect(result).toEqual(mockWorkStation);
      expect(repoMock.createWorkStation).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, code: 'LINE-01' }),
      );
    });
  });

  describe('updateWorkStation', () => {
    it('throws NotFoundException when station does not exist', async () => {
      repoMock.findWorkStationById.mockResolvedValue(null);

      await expect(
        service.updateWorkStation(tenantId, 'missing', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when code belongs to another station', async () => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      repoMock.findWorkStationByCode.mockResolvedValue({ ...mockWorkStation, id: 'ws-2' });

      await expect(
        service.updateWorkStation(tenantId, 'ws-1', { code: 'LINE-02' }),
      ).rejects.toThrow(ConflictException);
    });

    it('updates station when code is unchanged or unique', async () => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      repoMock.updateWorkStation.mockResolvedValue({ ...mockWorkStation, name: 'Updated' });

      const result = await service.updateWorkStation(tenantId, 'ws-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });
  });

  describe('findAllWorkStations and findAllRecipes', () => {
    it('delegates findAllWorkStations to repository', async () => {
      repoMock.findAllWorkStations.mockResolvedValue([mockWorkStation]);
      await expect(service.findAllWorkStations(tenantId)).resolves.toEqual([mockWorkStation]);
    });

    it('delegates findAllRecipes to repository', async () => {
      repoMock.findAllRecipes.mockResolvedValue([mockRecipe]);
      await expect(service.findAllRecipes(tenantId)).resolves.toEqual([mockRecipe]);
    });
  });

  describe('updateRecipe', () => {
    it('deactivates conflicting active recipe and bumps version when renaming', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.findActiveRecipeByName.mockResolvedValue({
        ...mockRecipe,
        id: 'recipe-other',
        name: 'New name',
        version: 2,
      });
      repoMock.updateRecipe.mockResolvedValue({ ...mockRecipe, name: 'New name', version: 3 });

      await service.updateRecipe(tenantId, 'recipe-1', { name: 'New name' });

      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-other',
        expect.objectContaining({ isActive: false }),
      );
      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ name: 'New name', version: 3 }),
      );
    });
  });

  describe('cloneRecipe', () => {
    it('throws NotFoundException when source recipe is missing', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(null);

      await expect(service.cloneRecipe(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('clones recipe and deactivates prior active clone name', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue({
        ...mockRecipe,
        phases: [],
      });
      repoMock.findActiveRecipeByName.mockResolvedValue({
        ...mockRecipe,
        id: 'recipe-old-clone',
        name: 'Pan integral (copia)',
        version: 1,
      });
      repoMock.updateRecipe.mockResolvedValue({});
      repoMock.cloneRecipeTx.mockResolvedValue({ ...mockRecipe, id: 'recipe-clone' });

      const result = await service.cloneRecipe(tenantId, 'recipe-1');

      expect(repoMock.updateRecipe).toHaveBeenCalledWith(tenantId, 'recipe-old-clone', {
        isActive: false,
      });
      expect(repoMock.cloneRecipeTx).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ name: 'Pan integral (copia)', version: 2 }),
      );
      expect(result.id).toBe('recipe-clone');
    });
  });

  describe('softDeleteRecipe', () => {
    it('soft-deletes existing recipe', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.softDeleteRecipe.mockResolvedValue({ ...mockRecipe, isActive: false });

      const result = await service.softDeleteRecipe(tenantId, 'recipe-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('reorderPhases validation', () => {
    beforeEach(() => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.findPhasesByRecipeId.mockResolvedValue([
        { id: 'phase-1', order: 1 },
        { id: 'phase-2', order: 2 },
      ]);
    });

    it('throws when reorder list length does not match phase count', async () => {
      await expect(
        service.reorderPhases(tenantId, 'recipe-1', [{ phaseId: 'phase-1', newOrder: 1 }]),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when newOrder values are duplicated', async () => {
      await expect(
        service.reorderPhases(tenantId, 'recipe-1', [
          { phaseId: 'phase-1', newOrder: 1 },
          { phaseId: 'phase-2', newOrder: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when newOrder is not a contiguous sequence', async () => {
      await expect(
        service.reorderPhases(tenantId, 'recipe-1', [
          { phaseId: 'phase-1', newOrder: 1 },
          { phaseId: 'phase-2', newOrder: 3 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRecipe validation', () => {
    it('throws when phase orders are duplicated', async () => {
      await expect(
        service.createRecipe(tenantId, {
          ...createRecipeInput,
          phases: [
            { ...createRecipeInput.phases[0], order: 1 },
            { ...createRecipeInput.phases[0], order: 1, name: 'Duplicado' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when minOperators exceeds maxOperators', async () => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);

      await expect(
        service.createRecipe(tenantId, {
          ...createRecipeInput,
          phases: [{ ...createRecipeInput.phases[0], minOperators: 5, maxOperators: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when work station is inactive', async () => {
      repoMock.findWorkStationById.mockResolvedValue({ ...mockWorkStation, isActive: false });

      await expect(service.createRecipe(tenantId, createRecipeInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when work station does not exist', async () => {
      repoMock.findWorkStationById.mockResolvedValue(null);

      await expect(service.createRecipe(tenantId, createRecipeInput)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removePhaseInput', () => {
    it('throws NotFoundException when input does not belong to phase', async () => {
      repoMock.findPhaseById.mockResolvedValue({
        id: 'phase-1',
        tenantId,
        recipeId: 'recipe-1',
      });
      repoMock.findPhaseInputById.mockResolvedValue({
        id: 'input-1',
        phaseId: 'other-phase',
        tenantId,
      });

      await expect(service.removePhaseInput(tenantId, 'phase-1', 'input-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes input when it belongs to the phase', async () => {
      const existingInput = {
        id: 'input-1',
        tenantId,
        phaseId: 'phase-1',
        supplyItemId: 'supply-1',
        quantityPerBatch: new Decimal('1'),
        unit: StockUnit.KILOGRAMS,
        isOptional: false,
      };
      repoMock.findPhaseById.mockResolvedValue({
        id: 'phase-1',
        tenantId,
        recipeId: 'recipe-1',
      });
      repoMock.findPhaseInputById.mockResolvedValue(existingInput);
      repoMock.deletePhaseInput.mockResolvedValue(existingInput);

      await expect(service.removePhaseInput(tenantId, 'phase-1', 'input-1')).resolves.toEqual(
        existingInput,
      );
    });
  });

  describe('addPhaseInput', () => {
    const phaseInput = {
      supplyItemId: 'supply-1',
      quantityPerBatch: new Decimal('2.5'),
      unit: StockUnit.KILOGRAMS,
      isOptional: false,
    };

    const createdInput = {
      id: 'input-1',
      tenantId,
      phaseId: 'phase-1',
      ...phaseInput,
      isOptional: false,
    };

    beforeEach(() => {
      repoMock.findPhaseById.mockResolvedValue({
        id: 'phase-1',
        tenantId,
        recipeId: 'recipe-1',
      });
      repoMock.createPhaseInput.mockResolvedValue(createdInput);
    });

    it('validates supply via SupplyItemsService.findOne before create', async () => {
      supplyItemsServiceMock.findOne.mockResolvedValue({ id: 'supply-1' });

      const result = await service.addPhaseInput(tenantId, 'phase-1', phaseInput);

      expect(supplyItemsServiceMock.findOne).toHaveBeenCalledWith(tenantId, 'supply-1');
      expect(repoMock.createPhaseInput).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          phaseId: 'phase-1',
          supplyItemId: 'supply-1',
        }),
      );
      expect(result).toEqual(createdInput);
    });

    it('propagates NotFoundException when supply item is missing', async () => {
      supplyItemsServiceMock.findOne.mockRejectedValue(
        new NotFoundException('Supply item not found'),
      );

      await expect(service.addPhaseInput(tenantId, 'phase-1', phaseInput)).rejects.toThrow(
        NotFoundException,
      );
      expect(repoMock.createPhaseInput).not.toHaveBeenCalled();
    });
  });

  describe('production orders', () => {
    const plannedStartAt = new Date('2026-05-27T08:00:00Z');
    const plannedEndAt = new Date('2026-05-27T12:00:00Z');

    const recipeWithPhases = {
      ...mockRecipe,
      phases: [
        {
          id: 'phase-1',
          tenantId,
          recipeId: 'recipe-1',
          workStationId: 'ws-1',
          order: 1,
          name: 'Mezclado',
          description: null,
          standardMinutes: 15,
          minOperators: 1,
          maxOperators: 4,
          requiresQA: false,
          inputs: [],
        },
        {
          id: 'phase-2',
          tenantId,
          recipeId: 'recipe-1',
          workStationId: 'ws-1',
          order: 2,
          name: 'Horneado',
          description: null,
          standardMinutes: 25,
          minOperators: 1,
          maxOperators: 4,
          requiresQA: false,
          inputs: [],
        },
      ],
    };

    const buildOrderDetail = (
      status: ProductionOrderStatus,
      executionStatuses: PhaseExecutionStatus[],
    ) => ({
      id: 'order-1',
      tenantId,
      number: '2026-1',
      recipeId: 'recipe-1',
      recipeVersion: 1,
      status,
      priority: ProductionPriority.NORMAL,
      shift: ProductionShift.MORNING,
      batchCount: 2,
      plannedQuantity: new Decimal('20'),
      producedQuantity: null,
      unit: StockUnit.UNIT,
      plannedStartAt,
      plannedEndAt,
      actualStartAt: null,
      actualEndAt: null,
      supervisorId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      recipe: { id: 'recipe-1', name: 'Pan integral' },
      executions: executionStatuses.map((executionStatus, index) => ({
        id: `exec-${index + 1}`,
        tenantId,
        orderId: 'order-1',
        phaseId: `phase-${index + 1}`,
        workStationId: 'ws-1',
        status: executionStatus,
        plannedMinutes: 30,
        actualMinutes: null,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        phase: {
          id: `phase-${index + 1}`,
          order: index + 1,
          name: index === 0 ? 'Mezclado' : 'Horneado',
          requiresQA: false,
          workStationId: 'ws-1',
        },
      })),
      activeSessions: [],
    });

    it('createOrder creates N PENDING executions for N recipe phases', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithPhases);
      repoMock.findOrders.mockResolvedValue([]);
      repoMock.createOrderWithExecutionsTx.mockResolvedValue({
        order: { id: 'order-1' },
        executions: [
          {
            id: 'exec-1',
            orderId: 'order-1',
            status: PhaseExecutionStatus.PENDING,
          },
          {
            id: 'exec-2',
            orderId: 'order-1',
            status: PhaseExecutionStatus.PENDING,
          },
        ],
      });
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.DRAFT, [
          PhaseExecutionStatus.PENDING,
          PhaseExecutionStatus.PENDING,
        ]),
      );

      const result = await service.createOrder(tenantId, {
        recipeId: 'recipe-1',
        batchCount: 2,
        shift: ProductionShift.MORNING,
        plannedStartAt,
        plannedEndAt,
      });

      expect(repoMock.createOrderWithExecutionsTx).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          recipeId: 'recipe-1',
          batchCount: 2,
        }),
      );
      expect(result.executions).toHaveLength(2);
      expect(
        result.executions.every((execution) => execution.status === PhaseExecutionStatus.PENDING),
      ).toBe(true);
    });

    it('planOrder promotes first execution to READY and emits websocket event', async () => {
      const draftDetail = buildOrderDetail(ProductionOrderStatus.DRAFT, [
        PhaseExecutionStatus.PENDING,
        PhaseExecutionStatus.PENDING,
      ]);
      const plannedDetail = buildOrderDetail(ProductionOrderStatus.PLANNED, [
        PhaseExecutionStatus.READY,
        PhaseExecutionStatus.PENDING,
      ]);

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(draftDetail)
        .mockResolvedValueOnce(plannedDetail);

      await service.planOrder(tenantId, 'order-1');

      expect(repoMock.updateOrder).toHaveBeenCalledWith(tenantId, 'order-1', {
        status: ProductionOrderStatus.PLANNED,
      });
      expect(repoMock.updateExecution).toHaveBeenCalledWith(tenantId, 'exec-1', {
        status: PhaseExecutionStatus.READY,
      });
      expect(plantEventsServiceMock.emitPhaseStatusChanges).toHaveBeenCalledWith(tenantId, [
        expect.objectContaining({
          id: 'exec-1',
          status: PhaseExecutionStatus.READY,
        }),
      ]);
    });

    it('cancelOrder throws BadRequestException for IN_PROCESS without consumedInputsAction', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [
          PhaseExecutionStatus.IN_PROCESS,
          PhaseExecutionStatus.PENDING,
        ]),
      );

      await expect(
        service.cancelOrder(tenantId, 'order-1', { reason: 'Cliente canceló' }, 'supervisor-1'),
      ).rejects.toThrow(BadRequestException);

      expect(repoMock.updateOrder).not.toHaveBeenCalled();
    });

    it('cancelOrder persists audit metadata and sets order CANCELLED', async () => {
      const inProcessDetail = buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [
        PhaseExecutionStatus.IN_PROCESS,
        PhaseExecutionStatus.PENDING,
      ]);
      const cancelledDetail = {
        ...inProcessDetail,
        status: ProductionOrderStatus.CANCELLED,
        notes: JSON.stringify({
          cancel: {
            reason: 'Cliente canceló',
            consumedInputsAction: 'SCRAP',
            cancelledAt: '2026-05-27T12:00:00.000Z',
            cancelledBy: 'supervisor-1',
          },
        }),
      };

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(inProcessDetail)
        .mockResolvedValueOnce(cancelledDetail);

      const result = await service.cancelOrder(
        tenantId,
        'order-1',
        { reason: 'Cliente canceló', consumedInputsAction: ConsumedInputsAction.SCRAP },
        'supervisor-1',
      );

      expect(repoMock.updateOrder).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        expect.objectContaining({
          status: ProductionOrderStatus.CANCELLED,
          notes: expect.stringContaining('"consumedInputsAction":"SCRAP"'),
        }),
      );
      expect(result.status).toBe(ProductionOrderStatus.CANCELLED);
    });

    it('pauseOrder pauses IN_PROCESS executions and emits events', async () => {
      const inProcessDetail = buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [
        PhaseExecutionStatus.IN_PROCESS,
        PhaseExecutionStatus.PENDING,
      ]);
      const pausedDetail = buildOrderDetail(ProductionOrderStatus.PAUSED, [
        PhaseExecutionStatus.PAUSED,
        PhaseExecutionStatus.PENDING,
      ]);

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(inProcessDetail)
        .mockResolvedValueOnce(pausedDetail);

      await service.pauseOrder(tenantId, 'order-1', { reason: 'Falla eléctrica' });

      expect(repoMock.updateOrder).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        expect.objectContaining({ status: ProductionOrderStatus.PAUSED }),
      );
      expect(repoMock.updateExecution).toHaveBeenCalledWith(tenantId, 'exec-1', {
        status: PhaseExecutionStatus.PAUSED,
      });
      expect(plantEventsServiceMock.emitPhaseStatusChanges).toHaveBeenCalled();
    });

    it('resumeOrder resumes PAUSED executions and emits events', async () => {
      const pausedDetail = buildOrderDetail(ProductionOrderStatus.PAUSED, [
        PhaseExecutionStatus.PAUSED,
        PhaseExecutionStatus.PENDING,
      ]);
      const resumedDetail = buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [
        PhaseExecutionStatus.IN_PROCESS,
        PhaseExecutionStatus.PENDING,
      ]);

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(pausedDetail)
        .mockResolvedValueOnce(resumedDetail);

      await service.resumeOrder(tenantId, 'order-1');

      expect(repoMock.updateOrder).toHaveBeenCalledWith(tenantId, 'order-1', {
        status: ProductionOrderStatus.IN_PROCESS,
      });
      expect(repoMock.updateExecution).toHaveBeenCalledWith(tenantId, 'exec-1', {
        status: PhaseExecutionStatus.IN_PROCESS,
      });
      expect(plantEventsServiceMock.emitPhaseStatusChanges).toHaveBeenCalled();
    });

    it('findOrders maps list items from repository', async () => {
      repoMock.findOrders.mockResolvedValue([
        {
          id: 'order-1',
          tenantId,
          number: '2026-1',
          status: ProductionOrderStatus.DRAFT,
          priority: ProductionPriority.NORMAL,
          shift: ProductionShift.MORNING,
          plannedStartAt,
          recipeId: 'recipe-1',
        },
      ]);

      const result = await service.findOrders(tenantId, {});

      expect(result).toEqual([
        expect.objectContaining({
          id: 'order-1',
          number: '2026-1',
          status: ProductionOrderStatus.DRAFT,
        }),
      ]);
    });

    it('createOrder throws when recipe is inactive', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue({ ...recipeWithPhases, isActive: false });

      await expect(
        service.createOrder(tenantId, {
          recipeId: 'recipe-1',
          batchCount: 2,
          shift: ProductionShift.MORNING,
          plannedStartAt,
          plannedEndAt,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('planOrder throws ConflictException when order is not DRAFT', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.PLANNED, [
          PhaseExecutionStatus.READY,
          PhaseExecutionStatus.PENDING,
        ]),
      );

      await expect(service.planOrder(tenantId, 'order-1')).rejects.toThrow(ConflictException);
    });

    it('cancelOrder throws when reason is missing', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.DRAFT, [PhaseExecutionStatus.PENDING]),
      );

      await expect(
        service.cancelOrder(tenantId, 'order-1', { reason: '   ' }, 'supervisor-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('cancelOrder throws ConflictException for COMPLETED orders', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.COMPLETED, [
          PhaseExecutionStatus.COMPLETED,
          PhaseExecutionStatus.COMPLETED,
        ]),
      );

      await expect(
        service.cancelOrder(
          tenantId,
          'order-1',
          { reason: 'Too late', consumedInputsAction: ConsumedInputsAction.SCRAP },
          'supervisor-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('pauseOrder throws when reason is missing', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [PhaseExecutionStatus.IN_PROCESS]),
      );

      await expect(service.pauseOrder(tenantId, 'order-1', { reason: '  ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('resumeOrder throws when order is not PAUSED', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [PhaseExecutionStatus.IN_PROCESS]),
      );

      await expect(service.resumeOrder(tenantId, 'order-1')).rejects.toThrow(ConflictException);
    });

    it('findOrderById throws NotFoundException when order is missing', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(null);

      await expect(service.findOrderById(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('createOrder throws NotFoundException when recipe is missing', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(null);

      await expect(
        service.createOrder(tenantId, {
          recipeId: 'missing',
          batchCount: 2,
          shift: ProductionShift.MORNING,
          plannedStartAt,
          plannedEndAt,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('createOrder throws ConflictException when execution count mismatches phases', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithPhases);
      repoMock.findOrders.mockResolvedValue([]);
      repoMock.createOrderWithExecutionsTx.mockResolvedValue({
        order: { id: 'order-1' },
        executions: [{ id: 'exec-1', orderId: 'order-1', status: PhaseExecutionStatus.PENDING }],
      });

      await expect(
        service.createOrder(tenantId, {
          recipeId: 'recipe-1',
          batchCount: 2,
          shift: ProductionShift.MORNING,
          plannedStartAt,
          plannedEndAt,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('cancelOrder throws BadRequestException for PAUSED without consumedInputsAction', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.PAUSED, [PhaseExecutionStatus.PAUSED]),
      );

      await expect(
        service.cancelOrder(tenantId, 'order-1', { reason: 'Stop' }, 'supervisor-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('cancelOrder throws ConflictException when order is already cancelled', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.CANCELLED, [PhaseExecutionStatus.PENDING]),
      );

      await expect(
        service.cancelOrder(tenantId, 'order-1', { reason: 'Again' }, 'supervisor-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('createOrder throws when plannedStartAt is not before plannedEndAt', async () => {
      await expect(
        service.createOrder(tenantId, {
          recipeId: 'recipe-1',
          batchCount: 2,
          shift: ProductionShift.MORNING,
          plannedStartAt: plannedEndAt,
          plannedEndAt: plannedStartAt,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('createOrder increments order number sequence for current year', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithPhases);
      repoMock.findOrders.mockResolvedValue([{ number: `${new Date().getFullYear()}-7` }]);
      repoMock.createOrderWithExecutionsTx.mockResolvedValue({
        order: { id: 'order-1' },
        executions: [
          { id: 'exec-1', orderId: 'order-1', status: PhaseExecutionStatus.PENDING },
          { id: 'exec-2', orderId: 'order-1', status: PhaseExecutionStatus.PENDING },
        ],
      });
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.DRAFT, [
          PhaseExecutionStatus.PENDING,
          PhaseExecutionStatus.PENDING,
        ]),
      );

      await service.createOrder(tenantId, {
        recipeId: 'recipe-1',
        batchCount: 2,
        shift: ProductionShift.MORNING,
        plannedStartAt,
        plannedEndAt,
      });

      expect(repoMock.createOrderWithExecutionsTx).toHaveBeenCalledWith(
        expect.objectContaining({
          number: `${new Date().getFullYear()}-8`,
        }),
      );
    });

    it('planOrder throws when first execution is not PENDING', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.DRAFT, [
          PhaseExecutionStatus.READY,
          PhaseExecutionStatus.PENDING,
        ]),
      );

      await expect(service.planOrder(tenantId, 'order-1')).rejects.toThrow(ConflictException);
    });

    it('cancelOrder throws BadRequestException for invalid consumedInputsAction', async () => {
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [PhaseExecutionStatus.IN_PROCESS]),
      );

      await expect(
        service.cancelOrder(
          tenantId,
          'order-1',
          { reason: 'Stop', consumedInputsAction: 'INVALID' as ConsumedInputsAction },
          'supervisor-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('cancelOrder merges cancel metadata with existing plain-text notes', async () => {
      const inProcessDetail = {
        ...buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [PhaseExecutionStatus.IN_PROCESS]),
        notes: 'Notas del supervisor',
      };
      const cancelledDetail = {
        ...inProcessDetail,
        status: ProductionOrderStatus.CANCELLED,
      };

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(inProcessDetail)
        .mockResolvedValueOnce(cancelledDetail);

      await service.cancelOrder(
        tenantId,
        'order-1',
        { reason: 'Cliente canceló', consumedInputsAction: ConsumedInputsAction.HOLD_FOR_REVIEW },
        'supervisor-1',
      );

      expect(repoMock.updateOrder).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        expect.objectContaining({
          notes: expect.stringContaining('"userNotes":"Notas del supervisor"'),
        }),
      );
    });
  });
});
