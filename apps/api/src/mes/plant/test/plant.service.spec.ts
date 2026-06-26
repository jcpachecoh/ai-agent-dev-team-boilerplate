import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PhaseExecutionStatus,
  ProductionCommitteeStatus,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
  StockUnit,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RecipeCategoriesService } from '../../../recipe-categories/service/recipe-categories.service';
import { SupplyItemsService } from '../../../supplyitems/service/supplyitems.service';
import { AuditService } from '../../../audit/service/audit.service';
import { PlantRepository } from '../repository/plant.repository';
import { CommitteeService } from '../service/committee.service';
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
  categoryId: 'cat-1',
  recipeType: 'FINAL_PRODUCT',
  finishedProductId: 'prod-1',
  batchSize: new Decimal('10'),
  batchUnit: StockUnit.UNIT,
  batchDisplayUnit: 'UNIT',
  packageWeightGrams: 500,
  expectedYield: new Decimal('10'),
  expectedYieldUnit: 'porciones',
  estimatedMinutes: 60,
  operationCenter: 'PLANT',
  technicalResponsible: 'CHEF',
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
  findRecipeByCategoryAndName: jest.fn(),
  previewNextRecipeCode: jest.fn(),
  findRecipeStatusHistory: jest.fn(),
  createRecipeStatusHistory: jest.fn(),
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
  createPhaseWithInputsTx: jest.fn(),
  updatePhase: jest.fn(),
  replacePhaseInputsTx: jest.fn(),
  countPhaseExecutions: jest.fn(),
  deletePhase: jest.fn(),
  createOrderWithExecutionsTx: jest.fn(),
  findOrders: jest.fn(),
  findOrderDetailById: jest.fn(),
  replaceOrderMaterialsTx: jest.fn(),
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

const auditServiceMock = { log: jest.fn().mockResolvedValue(undefined) };

const recipeCategoriesServiceMock = {
  findOne: jest.fn(),
};

const committeeServiceMock = {
  assertCommitteeActiveForOrder: jest.fn(),
  decrementOrdersCount: jest.fn(),
};

describe('PlantService', () => {
  let service: PlantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantService,
        { provide: PlantRepository, useValue: repoMock },
        { provide: CommitteeService, useValue: committeeServiceMock },
        { provide: RecipeCategoriesService, useValue: recipeCategoriesServiceMock },
        { provide: SupplyItemsService, useValue: supplyItemsServiceMock },
        { provide: PlantEventsService, useValue: plantEventsServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compile();

    service = module.get<PlantService>(PlantService);
    jest.clearAllMocks();
  });

  describe('createRecipe', () => {
    beforeEach(() => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      repoMock.createRecipeWithPhasesTx.mockResolvedValue(mockRecipe);
      repoMock.findRecipeByCategoryAndName.mockResolvedValue(null);
      recipeCategoriesServiceMock.findOne.mockResolvedValue({
        id: 'cat-1',
        tenantId,
        nombre: 'Platos',
        descripcion: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('calls createRecipeWithPhasesTx once when no duplicate name exists in category', async () => {
      const result = await service.createRecipe(tenantId, createRecipeInput);

      expect(result).toEqual(mockRecipe);
      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledTimes(1);
      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          recipe: expect.objectContaining({ version: 1, lifecycleStatus: 'TRIAL' }),
        }),
      );
      expect(auditServiceMock.log).toHaveBeenCalled();
    });

    it('throws ConflictException when recipe name exists in category', async () => {
      repoMock.findRecipeByCategoryAndName.mockResolvedValue(mockRecipe);

      await expect(service.createRecipe(tenantId, createRecipeInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('resolves categoryId via RecipeCategoriesService when provided', async () => {
      await service.createRecipe(tenantId, { ...createRecipeInput, categoryId: 'cat-1' });

      expect(recipeCategoriesServiceMock.findOne).toHaveBeenCalledWith(tenantId, 'cat-1');
      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe: expect.objectContaining({ categoryId: 'cat-1' }),
        }),
      );
    });

    it('validates phase inputs and maps optional recipe and phase fields', async () => {
      supplyItemsServiceMock.findOne.mockResolvedValue({ id: 'supply-1' });

      await service.createRecipe(tenantId, {
        ...createRecipeInput,
        notes: 'Batch notes',
        isActive: false,
        phases: [
          {
            ...createRecipeInput.phases[0],
            description: 'Phase description',
            minOperators: 2,
            maxOperators: 3,
            requiresQA: true,
            inputs: [
              {
                supplyItemId: 'supply-1',
                quantityPerBatch: new Decimal('2'),
                unit: StockUnit.KILOGRAMS,
                isOptional: true,
              },
            ],
          },
        ],
      });

      expect(supplyItemsServiceMock.findOne).toHaveBeenCalledWith(tenantId, 'supply-1');
      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe: expect.objectContaining({
            notes: 'Batch notes',
            isActive: false,
          }),
          phases: [
            expect.objectContaining({
              description: 'Phase description',
              minOperators: 2,
              maxOperators: 3,
              requiresQA: true,
              inputs: [
                expect.objectContaining({
                  supplyItemId: 'supply-1',
                  isOptional: true,
                }),
              ],
            }),
          ],
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

    it('includes categoryName when recipe has a category', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue({
        ...mockRecipe,
        category: { id: 'cat-1', nombre: 'Platos principales' },
        phases: [],
      });

      const result = await service.findRecipeById(tenantId, 'recipe-1');

      expect(result.categoryName).toBe('Platos principales');
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

    it('allows updating code when duplicate lookup returns the same station', async () => {
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      repoMock.findWorkStationByCode.mockResolvedValue(mockWorkStation);
      repoMock.updateWorkStation.mockResolvedValue(mockWorkStation);

      await expect(
        service.updateWorkStation(tenantId, 'ws-1', { code: 'LINE-01' }),
      ).resolves.toEqual(mockWorkStation);
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

    it('resolves categoryId on update when provided', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      recipeCategoriesServiceMock.findOne.mockResolvedValue({
        id: 'cat-2',
        tenantId,
        nombre: 'Postres',
        descripcion: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repoMock.updateRecipe.mockResolvedValue({ ...mockRecipe, categoryId: 'cat-2' });

      await service.updateRecipe(tenantId, 'recipe-1', { categoryId: 'cat-2' });

      expect(recipeCategoriesServiceMock.findOne).toHaveBeenCalledWith(tenantId, 'cat-2');
      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ categoryId: 'cat-2' }),
      );
    });

    it('clears categoryId on update when null is provided', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.updateRecipe.mockResolvedValue({ ...mockRecipe, categoryId: null });

      await service.updateRecipe(tenantId, 'recipe-1', { categoryId: null });

      expect(recipeCategoriesServiceMock.findOne).not.toHaveBeenCalled();
      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ categoryId: null }),
      );
    });

    it('maps batchDisplayUnit to batchUnit when batchUnit is omitted', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.updateRecipe.mockResolvedValue(mockRecipe);

      await service.updateRecipe(tenantId, 'recipe-1', { batchDisplayUnit: 'KILOGRAM' });

      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ batchUnit: StockUnit.KILOGRAMS }),
      );
    });

    it('derives packageWeight from packageWeightGrams when packageWeight is omitted', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.updateRecipe.mockResolvedValue(mockRecipe);

      await service.updateRecipe(tenantId, 'recipe-1', { packageWeightGrams: 500 });

      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({
          packageWeightGrams: 500,
          packageWeight: expect.any(Decimal),
        }),
      );
    });

    it('clears locationIds when operation center changes away from LOCATION', async () => {
      repoMock.findRecipeById.mockResolvedValue({
        ...mockRecipe,
        operationCenter: 'LOCATION',
      });
      repoMock.updateRecipe.mockResolvedValue(mockRecipe);

      await service.updateRecipe(tenantId, 'recipe-1', { operationCenter: 'PLANT' });

      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ operationCenter: 'PLANT', locationIds: [] }),
      );
    });

    it('throws when operation center is LOCATION without locations', async () => {
      repoMock.findRecipeById.mockResolvedValue({
        ...mockRecipe,
        operationCenter: 'PLANT',
      });

      await expect(
        service.updateRecipe(tenantId, 'recipe-1', {
          operationCenter: 'LOCATION',
          locationIds: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when locations are sent for a non-LOCATION operation center', async () => {
      repoMock.findRecipeById.mockResolvedValue({
        ...mockRecipe,
        operationCenter: 'PLANT',
      });

      await expect(
        service.updateRecipe(tenantId, 'recipe-1', { locationIds: ['loc-1'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when notes exceed 500 characters', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);

      await expect(
        service.updateRecipe(tenantId, 'recipe-1', { notes: 'x'.repeat(501) }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveRecipe', () => {
    it('approves a trial recipe and records history and audit', async () => {
      repoMock.findRecipeById.mockResolvedValue({
        ...mockRecipe,
        lifecycleStatus: 'TRIAL',
      });
      repoMock.updateRecipe.mockResolvedValue({
        ...mockRecipe,
        lifecycleStatus: 'ACTIVE',
        isActive: true,
      });

      const result = await service.approveRecipe(tenantId, 'recipe-1', 'user-1');

      expect(result.lifecycleStatus).toBe('ACTIVE');
      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ lifecycleStatus: 'ACTIVE', isActive: true }),
      );
      expect(repoMock.createRecipeStatusHistory).toHaveBeenCalledWith(
        expect.objectContaining({ fromStatus: 'TRIAL', toStatus: 'ACTIVE' }),
      );
      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'APPROVE', entityId: 'recipe-1' }),
      );
    });

    it('returns recipe unchanged when already active', async () => {
      const activeRecipe = { ...mockRecipe, lifecycleStatus: 'ACTIVE' as const };
      repoMock.findRecipeById.mockResolvedValue(activeRecipe);

      const result = await service.approveRecipe(tenantId, 'recipe-1');

      expect(result).toEqual(activeRecipe);
      expect(repoMock.updateRecipe).not.toHaveBeenCalled();
    });
  });

  describe('rejectRecipe', () => {
    it('rejects a recipe with reason and records history and audit', async () => {
      repoMock.findRecipeById.mockResolvedValue({
        ...mockRecipe,
        lifecycleStatus: 'TRIAL',
      });
      repoMock.updateRecipe.mockResolvedValue({
        ...mockRecipe,
        lifecycleStatus: 'INACTIVE',
        isActive: false,
      });

      const result = await service.rejectRecipe(tenantId, 'recipe-1', '  Falta documentación  ');

      expect(result.lifecycleStatus).toBe('INACTIVE');
      expect(repoMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({
          lifecycleStatus: 'INACTIVE',
          rejectionReason: 'Falta documentación',
        }),
      );
      expect(repoMock.createRecipeStatusHistory).toHaveBeenCalledWith(
        expect.objectContaining({ toStatus: 'INACTIVE', reason: 'Falta documentación' }),
      );
      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REJECT' }),
      );
    });

    it('throws when rejection reason is empty', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);

      await expect(service.rejectRecipe(tenantId, 'recipe-1', '   ')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('previewNextRecipeCode', () => {
    it('delegates to repository', async () => {
      repoMock.previewNextRecipeCode.mockResolvedValue('COC-0002');

      await expect(service.previewNextRecipeCode(tenantId, 'cat-1')).resolves.toBe('COC-0002');
      expect(repoMock.previewNextRecipeCode).toHaveBeenCalledWith(tenantId, 'cat-1');
    });
  });

  describe('getRecipeStatusHistory', () => {
    it('delegates to repository', async () => {
      const history = [{ id: 'hist-1' }];
      repoMock.findRecipeStatusHistory.mockResolvedValue(history);

      await expect(service.getRecipeStatusHistory(tenantId, 'recipe-1')).resolves.toEqual(history);
      expect(repoMock.findRecipeStatusHistory).toHaveBeenCalledWith(tenantId, 'recipe-1');
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

    it('clones recipe at version 1 when no prior active clone exists', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue({ ...mockRecipe, phases: [] });
      repoMock.findActiveRecipeByName.mockResolvedValue(null);
      repoMock.cloneRecipeTx.mockResolvedValue({ ...mockRecipe, id: 'recipe-clone-2' });

      await service.cloneRecipe(tenantId, 'recipe-1');

      expect(repoMock.updateRecipe).not.toHaveBeenCalled();
      expect(repoMock.cloneRecipeTx).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ version: 1 }),
      );
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

    it('throws when a phase id does not belong to the recipe', async () => {
      await expect(
        service.reorderPhases(tenantId, 'recipe-1', [
          { phaseId: 'phase-1', newOrder: 1 },
          { phaseId: 'phase-other', newOrder: 2 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRecipe validation', () => {
    beforeEach(() => {
      repoMock.findRecipeByCategoryAndName.mockResolvedValue(null);
      recipeCategoriesServiceMock.findOne.mockResolvedValue({
        id: 'cat-1',
        tenantId,
        nombre: 'Platos',
        descripcion: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repoMock.createRecipeWithPhasesTx.mockResolvedValue(mockRecipe);
    });

    it('throws when name is empty', async () => {
      await expect(
        service.createRecipe(tenantId, { ...createRecipeInput, name: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when name exceeds 150 characters', async () => {
      await expect(
        service.createRecipe(tenantId, { ...createRecipeInput, name: 'x'.repeat(151) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when categoryId is missing', async () => {
      await expect(
        service.createRecipe(tenantId, { ...createRecipeInput, categoryId: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when finished product is missing for non-draft recipes', async () => {
      await expect(
        service.createRecipe(tenantId, { ...createRecipeInput, finishedProductId: '  ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when non-draft recipe has no phases', async () => {
      await expect(
        service.createRecipe(tenantId, { ...createRecipeInput, phases: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates draft recipe without phases or finished product', async () => {
      await service.createRecipe(tenantId, {
        ...createRecipeInput,
        name: 'Borrador',
        isDraft: true,
        finishedProductId: null,
        phases: [],
      });

      expect(repoMock.createRecipeWithPhasesTx).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe: expect.objectContaining({ isDraft: true }),
        }),
      );
    });

    it('throws when batch unit is missing on draft recipe', async () => {
      const {
        batchUnit: _batchUnit,
        batchDisplayUnit: _batchDisplayUnit,
        ...draftInput
      } = {
        ...createRecipeInput,
        name: 'Borrador',
        isDraft: true,
        finishedProductId: null,
        phases: [],
      };

      await expect(
        service.createRecipe(tenantId, draftInput as unknown as CreateRecipeWithPhasesInput),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when operation center is LOCATION without locations', async () => {
      await expect(
        service.createRecipe(tenantId, {
          ...createRecipeInput,
          operationCenter: 'LOCATION',
          locationIds: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when locations are provided without LOCATION operation center', async () => {
      await expect(
        service.createRecipe(tenantId, {
          ...createRecipeInput,
          operationCenter: 'PLANT',
          locationIds: ['loc-1'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

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

  describe('createPhaseOnRecipe', () => {
    it('creates a phase with validated inputs', async () => {
      repoMock.findRecipeById.mockResolvedValue(mockRecipe);
      repoMock.findWorkStationById.mockResolvedValue(mockWorkStation);
      supplyItemsServiceMock.findOne.mockResolvedValue({ id: 'supply-1' });
      repoMock.createPhaseWithInputsTx.mockResolvedValue({ id: 'phase-new' });

      await service.createPhaseOnRecipe(tenantId, 'recipe-1', {
        order: 2,
        name: 'Horneado',
        workStationId: 'ws-1',
        standardMinutes: 30,
        inputs: [
          {
            supplyItemId: 'supply-1',
            quantityPerBatch: new Decimal('1'),
            unit: StockUnit.UNIT,
            isOptional: true,
          },
        ],
      });

      expect(supplyItemsServiceMock.findOne).toHaveBeenCalledWith(tenantId, 'supply-1');
      expect(repoMock.createPhaseWithInputsTx).toHaveBeenCalled();
    });
  });

  describe('updatePhase', () => {
    const mockPhase = {
      id: 'phase-1',
      tenantId,
      recipeId: 'recipe-1',
      name: 'Mezclado',
      order: 1,
      workStationId: 'ws-1',
      standardMinutes: 15,
      minOperators: 1,
      maxOperators: 4,
      requiresQA: false,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('replaces phase inputs when inputs are provided', async () => {
      repoMock.findPhaseById.mockResolvedValue(mockPhase);
      repoMock.updatePhase.mockResolvedValue(mockPhase);
      supplyItemsServiceMock.findOne.mockResolvedValue({ id: 'supply-1' });
      repoMock.replacePhaseInputsTx.mockResolvedValue(undefined);

      await service.updatePhase(tenantId, 'phase-1', {
        inputs: [
          {
            supplyItemId: 'supply-1',
            quantityPerBatch: new Decimal('2'),
            unit: StockUnit.KILOGRAMS,
          },
        ],
      });

      expect(repoMock.replacePhaseInputsTx).toHaveBeenCalledWith(
        tenantId,
        'phase-1',
        expect.arrayContaining([
          expect.objectContaining({ supplyItemId: 'supply-1', isOptional: false }),
        ]),
      );
    });

    it('throws when minOperators exceeds maxOperators', async () => {
      repoMock.findPhaseById.mockResolvedValue(mockPhase);

      await expect(
        service.updatePhase(tenantId, 'phase-1', { minOperators: 5, maxOperators: 2 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deletePhase', () => {
    it('throws ConflictException when phase has executions', async () => {
      repoMock.findPhaseById.mockResolvedValue({ id: 'phase-1', tenantId });
      repoMock.countPhaseExecutions.mockResolvedValue(2);

      await expect(service.deletePhase(tenantId, 'phase-1')).rejects.toThrow(ConflictException);
      expect(repoMock.deletePhase).not.toHaveBeenCalled();
    });

    it('deletes phase when there are no executions', async () => {
      repoMock.findPhaseById.mockResolvedValue({ id: 'phase-1', tenantId });
      repoMock.countPhaseExecutions.mockResolvedValue(0);
      repoMock.deletePhase.mockResolvedValue(undefined);

      await service.deletePhase(tenantId, 'phase-1');

      expect(repoMock.deletePhase).toHaveBeenCalledWith(tenantId, 'phase-1');
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
    const committeeId = 'committee-1';
    const activeCommittee = {
      id: committeeId,
      tenantId,
      number: 'OP0001',
      status: ProductionCommitteeStatus.ACTIVE,
      ordersCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      committeeServiceMock.assertCommitteeActiveForOrder.mockResolvedValue(activeCommittee);
    });

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
      lotNumber: null,
      productionDate: null,
      deliveryDate: null,
      packageWeight: null,
      batchWeight: null,
      committeeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      recipe: { id: 'recipe-1', name: 'Pan integral', packageWeight: null },
      materials: [],
      byproducts: [],
      qualityChecks: [],
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
        startedAt: null,
        completedAt: null,
        operatorCount: null,
        deliveredQuantity: null,
        responsibleUserId: null,
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
        committeeId,
      });

      expect(repoMock.createOrderWithExecutionsTx).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          recipeId: 'recipe-1',
          batchCount: 2,
          number: 'OP0001-01',
          committeeId,
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

      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithPhases);
      repoMock.replaceOrderMaterialsTx.mockResolvedValue(undefined);
      repoMock.findOrderDetailById
        .mockResolvedValueOnce(draftDetail)
        .mockResolvedValueOnce(plannedDetail);

      await service.planOrder(tenantId, 'order-1');

      expect(repoMock.replaceOrderMaterialsTx).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        expect.any(Array),
      );
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
          committeeId,
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

    it('findOrderById backfills material snapshot for planned orders without materials', async () => {
      const plannedWithoutMaterials = buildOrderDetail(ProductionOrderStatus.PLANNED, [
        PhaseExecutionStatus.READY,
        PhaseExecutionStatus.PENDING,
      ]);
      const plannedWithMaterials = {
        ...plannedWithoutMaterials,
        materials: [
          {
            id: 'mat-1',
            tenantId,
            orderId: 'order-1',
            supplyItemId: 'supply-1',
            materialName: 'Harina',
            lotNumber: null,
            requiredQuantity: new Decimal('4'),
            consumedQuantity: null,
            unit: StockUnit.KILOGRAMS,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      const recipeWithInputs = {
        ...recipeWithPhases,
        phases: [
          {
            ...recipeWithPhases.phases[0],
            inputs: [
              {
                supplyItemId: 'supply-1',
                quantityPerBatch: new Decimal('2'),
                unit: StockUnit.KILOGRAMS,
              },
            ],
          },
          recipeWithPhases.phases[1],
        ],
      };

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(plannedWithoutMaterials)
        .mockResolvedValueOnce(plannedWithMaterials);
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithInputs);
      repoMock.replaceOrderMaterialsTx.mockResolvedValue(undefined);
      supplyItemsServiceMock.findOne.mockResolvedValue({ nombre: 'Harina' });

      const result = await service.findOrderById(tenantId, 'order-1');

      expect(repoMock.replaceOrderMaterialsTx).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        expect.arrayContaining([
          expect.objectContaining({
            supplyItemId: 'supply-1',
            materialName: 'Harina',
          }),
        ]),
      );
      expect(result.materials).toHaveLength(1);
      expect(result.materials[0]?.materialName).toBe('Harina');
    });

    it('findOrderById aggregates duplicate supply items and falls back to supplyItemId when lookup fails', async () => {
      const plannedWithoutMaterials = buildOrderDetail(ProductionOrderStatus.IN_PROCESS, [
        PhaseExecutionStatus.IN_PROCESS,
        PhaseExecutionStatus.PENDING,
      ]);
      const plannedWithMaterials = {
        ...plannedWithoutMaterials,
        materials: [
          {
            id: 'mat-1',
            tenantId,
            orderId: 'order-1',
            supplyItemId: 'supply-1',
            materialName: 'supply-1',
            lotNumber: null,
            requiredQuantity: new Decimal('8'),
            consumedQuantity: null,
            unit: StockUnit.KILOGRAMS,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      const recipeWithDuplicateInputs = {
        ...recipeWithPhases,
        phases: recipeWithPhases.phases.map((phase) => ({
          ...phase,
          inputs: [
            {
              supplyItemId: 'supply-1',
              quantityPerBatch: new Decimal('2'),
              unit: StockUnit.KILOGRAMS,
            },
          ],
        })),
      };

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(plannedWithoutMaterials)
        .mockResolvedValueOnce(plannedWithMaterials);
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithDuplicateInputs);
      repoMock.replaceOrderMaterialsTx.mockResolvedValue(undefined);
      supplyItemsServiceMock.findOne.mockRejectedValue(
        new NotFoundException('missing supply item'),
      );

      const result = await service.findOrderById(tenantId, 'order-1');

      expect(repoMock.replaceOrderMaterialsTx).toHaveBeenCalledWith(tenantId, 'order-1', [
        expect.objectContaining({
          supplyItemId: 'supply-1',
          materialName: 'supply-1',
          requiredQuantity: expect.objectContaining({ toString: expect.any(Function) }),
        }),
      ]);
      expect(result.materials[0]?.materialName).toBe('supply-1');
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
          committeeId,
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
          committeeId,
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
          committeeId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('createOrder assigns committee-scoped OP number', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithPhases);
      repoMock.findOrders.mockResolvedValue([{ number: 'OP0001-01' }, { number: 'OP0001-03' }]);
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
        committeeId,
      });

      expect(repoMock.findOrders).toHaveBeenCalledWith(tenantId, { committeeId });
      expect(repoMock.createOrderWithExecutionsTx).toHaveBeenCalledWith(
        expect.objectContaining({
          number: 'OP0001-04',
          committeeId,
        }),
      );
    });

    it('createOrder validates active committee and passes committeeId to repository', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithPhases);
      repoMock.findOrders.mockResolvedValue([]);
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
        committeeId,
      });

      expect(committeeServiceMock.assertCommitteeActiveForOrder).toHaveBeenCalledWith(
        tenantId,
        committeeId,
      );
      expect(repoMock.createOrderWithExecutionsTx).toHaveBeenCalledWith(
        expect.objectContaining({
          number: 'OP0001-01',
          committeeId,
        }),
      );
    });

    it('createOrder without committeeId throws BadRequestException', async () => {
      repoMock.findRecipeDetailById.mockResolvedValue(recipeWithPhases);

      await expect(
        service.createOrder(tenantId, {
          recipeId: 'recipe-1',
          batchCount: 2,
          shift: ProductionShift.MORNING,
          plannedStartAt,
          plannedEndAt,
          committeeId: '',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(committeeServiceMock.assertCommitteeActiveForOrder).not.toHaveBeenCalled();
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

    it('cancelOrder decrements committee ordersCount when order has committeeId', async () => {
      const orderWithCommittee = {
        ...buildOrderDetail(ProductionOrderStatus.DRAFT, [PhaseExecutionStatus.PENDING]),
        committeeId,
      };
      const cancelledDetail = {
        ...orderWithCommittee,
        status: ProductionOrderStatus.CANCELLED,
      };

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(orderWithCommittee)
        .mockResolvedValueOnce(cancelledDetail);
      committeeServiceMock.decrementOrdersCount.mockResolvedValue(undefined);

      await service.cancelOrder(tenantId, 'order-1', { reason: 'Prueba' }, 'supervisor-1');

      expect(committeeServiceMock.decrementOrdersCount).toHaveBeenCalledWith(committeeId);
    });

    it('cancelOrder does not call decrementOrdersCount when order has no committeeId', async () => {
      const orderWithoutCommittee = buildOrderDetail(ProductionOrderStatus.DRAFT, [
        PhaseExecutionStatus.PENDING,
      ]);
      const cancelledDetail = {
        ...orderWithoutCommittee,
        status: ProductionOrderStatus.CANCELLED,
      };

      repoMock.findOrderDetailById
        .mockResolvedValueOnce(orderWithoutCommittee)
        .mockResolvedValueOnce(cancelledDetail);

      await service.cancelOrder(tenantId, 'order-1', { reason: 'Prueba' }, 'supervisor-1');

      expect(committeeServiceMock.decrementOrdersCount).not.toHaveBeenCalled();
    });
  });
});
