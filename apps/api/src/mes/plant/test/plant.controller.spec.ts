import { OperationalRole, StockUnit } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { MesJwtGuard } from '../../auth/guards/mes-jwt.guard';
import type { MesJwtPayload } from '../../auth/interfaces/mes-auth.interfaces';
import { PlantController } from '../controller/plant.controller';
import { PlantService } from '../service/plant.service';

const tenantId = 'palos-de-lena';

const mesUser: MesJwtPayload = {
  sub: 'op-user-1',
  cedulaHash: 'cedula-hash',
  role: OperationalRole.OWNER,
  tenantId,
  sedeId: null,
};

const buildReq = (user: MesJwtPayload = mesUser) => ({ user }) as never;

const serviceMock = {
  createWorkStation: jest.fn(),
  findAllWorkStations: jest.fn(),
  updateWorkStation: jest.fn(),
  softDeleteWorkStation: jest.fn(),
  createRecipe: jest.fn(),
  findAllRecipes: jest.fn(),
  findRecipeById: jest.fn(),
  updateRecipe: jest.fn(),
  cloneRecipe: jest.fn(),
  softDeleteRecipe: jest.fn(),
  reorderPhases: jest.fn(),
  addPhaseInput: jest.fn(),
  removePhaseInput: jest.fn(),
};

describe('PlantController', () => {
  let controller: PlantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantController],
      providers: [{ provide: PlantService, useValue: serviceMock }],
    })
      .overrideGuard(MesJwtGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PlantController>(PlantController);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  describe('workstations', () => {
    it('createWorkStation passes tenantId from JWT user', async () => {
      const dto = { name: 'Línea 1', code: 'LINE-01' };
      serviceMock.createWorkStation.mockResolvedValue({ id: 'ws-1', ...dto, tenantId });

      await controller.createWorkStation(buildReq(), dto);

      expect(serviceMock.createWorkStation).toHaveBeenCalledWith(tenantId, dto);
    });

    it('findAllWorkStations passes tenantId from JWT user', async () => {
      serviceMock.findAllWorkStations.mockResolvedValue([]);

      await controller.findAllWorkStations(buildReq());

      expect(serviceMock.findAllWorkStations).toHaveBeenCalledWith(tenantId);
    });

    it('updateWorkStation passes tenantId, id, and dto', async () => {
      const dto = { name: 'Updated' };
      serviceMock.updateWorkStation.mockResolvedValue({ id: 'ws-1' });

      await controller.updateWorkStation(buildReq(), 'ws-1', dto);

      expect(serviceMock.updateWorkStation).toHaveBeenCalledWith(tenantId, 'ws-1', dto);
    });

    it('softDeleteWorkStation passes tenantId and id', async () => {
      serviceMock.softDeleteWorkStation.mockResolvedValue({ id: 'ws-1', isActive: false });

      await controller.softDeleteWorkStation(buildReq(), 'ws-1');

      expect(serviceMock.softDeleteWorkStation).toHaveBeenCalledWith(tenantId, 'ws-1');
    });
  });

  describe('recipes', () => {
    const createRecipeDto = {
      name: 'Pan integral',
      finishedProductId: 'prod-1',
      batchSize: '10.000',
      batchUnit: StockUnit.UNIT,
      estimatedMinutes: 60,
      phases: [
        {
          order: 1,
          name: 'Mezclado',
          workStationId: 'ws-1',
          standardMinutes: 15,
        },
      ],
    };

    it('createRecipe maps decimals and passes tenantId', async () => {
      serviceMock.createRecipe.mockResolvedValue({ id: 'recipe-1' });

      await controller.createRecipe(buildReq(), createRecipeDto);

      expect(serviceMock.createRecipe).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          name: createRecipeDto.name,
          batchSize: expect.any(Decimal),
          phases: [
            expect.objectContaining({
              workStationId: 'ws-1',
              standardMinutes: 15,
            }),
          ],
        }),
      );
    });

    it('findAllRecipes passes tenantId', async () => {
      serviceMock.findAllRecipes.mockResolvedValue([]);

      await controller.findAllRecipes(buildReq());

      expect(serviceMock.findAllRecipes).toHaveBeenCalledWith(tenantId);
    });

    it('reorderPhases passes tenantId, recipe id, and items', async () => {
      const items = [{ phaseId: 'phase-1', newOrder: 1 }];
      serviceMock.reorderPhases.mockResolvedValue(undefined);

      await controller.reorderPhases(buildReq(), 'recipe-1', items);

      expect(serviceMock.reorderPhases).toHaveBeenCalledWith(tenantId, 'recipe-1', items);
    });

    it('cloneRecipe passes tenantId and id', async () => {
      serviceMock.cloneRecipe.mockResolvedValue({ id: 'recipe-2' });

      await controller.cloneRecipe(buildReq(), 'recipe-1');

      expect(serviceMock.cloneRecipe).toHaveBeenCalledWith(tenantId, 'recipe-1');
    });

    it('findRecipeById passes tenantId and id', async () => {
      serviceMock.findRecipeById.mockResolvedValue({
        id: 'recipe-1',
        totalStandardMinutes: 30,
      });

      await controller.findRecipeById(buildReq(), 'recipe-1');

      expect(serviceMock.findRecipeById).toHaveBeenCalledWith(tenantId, 'recipe-1');
    });

    it('updateRecipe maps optional batchSize and passes tenantId', async () => {
      const dto = { batchSize: '12.500' };
      serviceMock.updateRecipe.mockResolvedValue({ id: 'recipe-1' });

      await controller.updateRecipe(buildReq(), 'recipe-1', dto);

      expect(serviceMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ batchSize: expect.any(Decimal) }),
      );
    });

    it('softDeleteRecipe passes tenantId and id', async () => {
      serviceMock.softDeleteRecipe.mockResolvedValue({ id: 'recipe-1', isActive: false });

      await controller.softDeleteRecipe(buildReq(), 'recipe-1');

      expect(serviceMock.softDeleteRecipe).toHaveBeenCalledWith(tenantId, 'recipe-1');
    });
  });

  describe('phase inputs', () => {
    it('addPhaseInput maps decimals and passes tenantId and phase id', async () => {
      const dto = {
        supplyItemId: 'supply-1',
        quantityPerBatch: '1.500',
        unit: StockUnit.GRAMS,
      };
      serviceMock.addPhaseInput.mockResolvedValue({ id: 'input-1' });

      await controller.addPhaseInput(buildReq(), 'phase-1', dto);

      expect(serviceMock.addPhaseInput).toHaveBeenCalledWith(
        tenantId,
        'phase-1',
        expect.objectContaining({
          supplyItemId: 'supply-1',
          quantityPerBatch: expect.any(Decimal),
          unit: StockUnit.GRAMS,
        }),
      );
    });

    it('removePhaseInput passes tenantId, phase id, and input id', async () => {
      serviceMock.removePhaseInput.mockResolvedValue({ id: 'input-1' });

      await controller.removePhaseInput(buildReq(), 'phase-1', 'input-1');

      expect(serviceMock.removePhaseInput).toHaveBeenCalledWith(tenantId, 'phase-1', 'input-1');
    });
  });
});
