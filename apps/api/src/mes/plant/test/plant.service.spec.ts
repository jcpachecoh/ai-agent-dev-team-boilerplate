import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StockUnit } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SupplyItemsService } from '../../../supplyitems/service/supplyitems.service';
import { PlantRepository } from '../repository/plant.repository';
import { PlantService } from '../service/plant.service';
import type { CreateRecipeWithPhasesInput } from '../interfaces/plant.interfaces';

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
};

const supplyItemsServiceMock = {
  findOne: jest.fn(),
};

describe('PlantService', () => {
  let service: PlantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantService,
        { provide: PlantRepository, useValue: repoMock },
        { provide: SupplyItemsService, useValue: supplyItemsServiceMock },
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
});
