import { Test, TestingModule } from '@nestjs/testing';
import { PhaseExecutionStatus, ProductionOrderStatus, StockUnit } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlantRepository } from '../repository/plant.repository';

const tenantId = 'palos-de-lena';

const txMock = {
  productionRecipe: {
    update: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  productionPhase: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  phaseInput: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  productionOrder: {
    create: jest.fn(),
  },
  phaseExecution: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  productionOrderMaterial: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
};

const prismaMock = {
  workStation: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  productionRecipe: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  productionPhase: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  phaseInput: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  phaseExecution: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  productionOrder: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  operatorSession: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PlantRepository', () => {
  let repository: PlantRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlantRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<PlantRepository>(PlantRepository);
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => unknown) =>
      cb(txMock),
    );
  });

  describe('workstations', () => {
    it('findAllWorkStations queries by tenant ordered by createdAt desc', async () => {
      prismaMock.workStation.findMany.mockResolvedValue([]);
      await repository.findAllWorkStations(tenantId);
      expect(prismaMock.workStation.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('findWorkStationById scopes by tenant and id', async () => {
      prismaMock.workStation.findFirst.mockResolvedValue(null);
      await repository.findWorkStationById(tenantId, 'ws-1');
      expect(prismaMock.workStation.findFirst).toHaveBeenCalledWith({
        where: { id: 'ws-1', tenantId },
      });
    });

    it('findWorkStationByCode scopes by tenant and code', async () => {
      prismaMock.workStation.findFirst.mockResolvedValue(null);
      await repository.findWorkStationByCode(tenantId, 'LINE-01');
      expect(prismaMock.workStation.findFirst).toHaveBeenCalledWith({
        where: { tenantId, code: 'LINE-01' },
      });
    });

    it('createWorkStation delegates to prisma.create', async () => {
      const data = { tenantId, name: 'Line', code: 'LINE-01' };
      prismaMock.workStation.create.mockResolvedValue({ id: 'ws-1', ...data });
      await repository.createWorkStation(data as never);
      expect(prismaMock.workStation.create).toHaveBeenCalledWith({ data });
    });

    it('updateWorkStation delegates to prisma.update', async () => {
      prismaMock.workStation.update.mockResolvedValue({ id: 'ws-1' });
      await repository.updateWorkStation(tenantId, 'ws-1', { name: 'Updated' });
      expect(prismaMock.workStation.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: { name: 'Updated' },
      });
    });

    it('softDeleteWorkStation sets isActive false', async () => {
      prismaMock.workStation.update.mockResolvedValue({ id: 'ws-1', isActive: false });
      await repository.softDeleteWorkStation(tenantId, 'ws-1');
      expect(prismaMock.workStation.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: { isActive: false },
      });
    });

    it('hasActiveExecutionsForWorkStation queries non-terminal executions by tenant and station', async () => {
      prismaMock.phaseExecution.findFirst.mockResolvedValue({ id: 'exec-1' });
      await repository.hasActiveExecutionsForWorkStation(tenantId, 'ws-1');
      expect(prismaMock.phaseExecution.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          workStationId: 'ws-1',
          status: { not: PhaseExecutionStatus.COMPLETED },
        },
      });
    });

    it('hasActiveExecutionsForWorkStation returns true when execution exists', async () => {
      prismaMock.phaseExecution.findFirst.mockResolvedValue({ id: 'exec-1' });
      await expect(repository.hasActiveExecutionsForWorkStation(tenantId, 'ws-1')).resolves.toBe(
        true,
      );
    });

    it('hasActiveExecutionsForWorkStation returns false when no execution exists', async () => {
      prismaMock.phaseExecution.findFirst.mockResolvedValue(null);
      await expect(repository.hasActiveExecutionsForWorkStation(tenantId, 'ws-1')).resolves.toBe(
        false,
      );
    });
  });

  describe('recipes', () => {
    it('findAllRecipes queries by tenant with active-first ordering', async () => {
      prismaMock.productionRecipe.findMany.mockResolvedValue([]);
      await repository.findAllRecipes(tenantId);
      expect(prismaMock.productionRecipe.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        include: {
          category: { select: { id: true, nombre: true } },
        },
        orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
      });
    });

    it('findRecipeById scopes by tenant and id', async () => {
      prismaMock.productionRecipe.findFirst.mockResolvedValue(null);
      await repository.findRecipeById(tenantId, 'recipe-1');
      expect(prismaMock.productionRecipe.findFirst).toHaveBeenCalledWith({
        where: { id: 'recipe-1', tenantId },
      });
    });

    it('findActiveRecipeByName filters active recipes by name', async () => {
      prismaMock.productionRecipe.findFirst.mockResolvedValue(null);
      await repository.findActiveRecipeByName(tenantId, 'Pan');
      expect(prismaMock.productionRecipe.findFirst).toHaveBeenCalledWith({
        where: { tenantId, name: 'Pan', isActive: true },
      });
    });

    it('findRecipeDetailById includes ordered phases and inputs', async () => {
      prismaMock.productionRecipe.findFirst.mockResolvedValue(null);
      await repository.findRecipeDetailById(tenantId, 'recipe-1');
      expect(prismaMock.productionRecipe.findFirst).toHaveBeenCalledWith({
        where: { id: 'recipe-1', tenantId },
        include: {
          category: { select: { id: true, nombre: true } },
          phases: {
            orderBy: { order: 'asc' },
            include: { inputs: true },
          },
        },
      });
    });

    it('createRecipeWithPhasesTx deactivates prior recipe and creates nested data', async () => {
      const createdRecipe = { id: 'recipe-new', tenantId, name: 'Pan' };
      txMock.productionRecipe.update.mockResolvedValue({});
      txMock.productionRecipe.create.mockResolvedValue(createdRecipe);
      txMock.productionPhase.create.mockResolvedValue({ id: 'phase-1' });

      const result = await repository.createRecipeWithPhasesTx({
        tenantId,
        deactivateRecipeId: 'recipe-old',
        recipe: {
          name: 'Pan',
          finishedProductId: 'prod-1',
          batchSize: new Decimal('10'),
          batchUnit: StockUnit.UNIT,
          estimatedMinutes: 60,
          version: 2,
          notes: null,
        },
        phases: [
          {
            order: 1,
            name: 'Mezclado',
            description: null,
            workStationId: 'ws-1',
            standardMinutes: 15,
            minOperators: 1,
            maxOperators: 4,
            requiresQA: false,
            inputs: [
              {
                supplyItemId: 'supply-1',
                quantityPerBatch: new Decimal('1'),
                unit: StockUnit.KILOGRAMS,
                isOptional: false,
              },
            ],
          },
        ],
      });

      expect(txMock.productionRecipe.update).toHaveBeenCalledWith({
        where: { id: 'recipe-old' },
        data: { isActive: false },
      });
      expect(txMock.productionPhase.create).toHaveBeenCalled();
      expect(txMock.phaseInput.create).toHaveBeenCalled();
      expect(result).toEqual(createdRecipe);
    });

    it('updateRecipe delegates to prisma.update', async () => {
      prismaMock.productionRecipe.update.mockResolvedValue({ id: 'recipe-1' });
      await repository.updateRecipe(tenantId, 'recipe-1', { name: 'Updated' });
      expect(prismaMock.productionRecipe.update).toHaveBeenCalledWith({
        where: { id: 'recipe-1' },
        data: { name: 'Updated' },
      });
    });

    it('softDeleteRecipe sets isActive false', async () => {
      prismaMock.productionRecipe.update.mockResolvedValue({ id: 'recipe-1', isActive: false });
      await repository.softDeleteRecipe(tenantId, 'recipe-1');
      expect(prismaMock.productionRecipe.update).toHaveBeenCalledWith({
        where: { id: 'recipe-1' },
        data: { isActive: false },
      });
    });

    it('cloneRecipeTx throws when source recipe is missing', async () => {
      txMock.productionRecipe.findFirst.mockResolvedValue(null);
      await expect(
        repository.cloneRecipeTx(tenantId, 'missing', {
          name: 'Clone',
          finishedProductId: 'prod-1',
          batchSize: new Decimal('10'),
          batchUnit: StockUnit.UNIT,
          estimatedMinutes: 60,
          version: 1,
        }),
      ).rejects.toThrow('Source recipe not found: missing');
    });

    it('cloneRecipeTx copies phases and inputs from source', async () => {
      txMock.productionRecipe.findFirst.mockResolvedValue({
        id: 'recipe-1',
        phases: [
          {
            workStationId: 'ws-1',
            order: 1,
            name: 'A',
            description: null,
            standardMinutes: 10,
            minOperators: 1,
            maxOperators: 4,
            requiresQA: false,
            inputs: [
              {
                supplyItemId: 'supply-1',
                quantityPerBatch: new Decimal('1'),
                unit: StockUnit.KILOGRAMS,
                isOptional: false,
              },
            ],
          },
        ],
      });
      txMock.productionRecipe.create.mockResolvedValue({ id: 'recipe-clone' });
      txMock.productionPhase.create.mockResolvedValue({ id: 'phase-clone' });

      const result = await repository.cloneRecipeTx(tenantId, 'recipe-1', {
        name: 'Clone',
        finishedProductId: 'prod-1',
        batchSize: new Decimal('10'),
        batchUnit: StockUnit.UNIT,
        estimatedMinutes: 60,
        version: 1,
      });

      expect(txMock.productionPhase.create).toHaveBeenCalled();
      expect(txMock.phaseInput.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'recipe-clone' });
    });
  });

  describe('phases and inputs', () => {
    it('findPhaseById scopes by tenant and id', async () => {
      prismaMock.productionPhase.findFirst.mockResolvedValue(null);
      await repository.findPhaseById(tenantId, 'phase-1');
      expect(prismaMock.productionPhase.findFirst).toHaveBeenCalledWith({
        where: { id: 'phase-1', tenantId },
      });
    });

    it('findPhasesByRecipeId orders by order asc', async () => {
      prismaMock.productionPhase.findMany.mockResolvedValue([]);
      await repository.findPhasesByRecipeId(tenantId, 'recipe-1');
      expect(prismaMock.productionPhase.findMany).toHaveBeenCalledWith({
        where: { tenantId, recipeId: 'recipe-1' },
        orderBy: { order: 'asc' },
      });
    });

    it('reorderPhasesTx updates each phase order inside a transaction', async () => {
      await repository.reorderPhasesTx(tenantId, 'recipe-1', [
        { phaseId: 'phase-1', newOrder: 2 },
        { phaseId: 'phase-2', newOrder: 1 },
      ]);

      expect(txMock.productionPhase.updateMany).toHaveBeenCalledTimes(2);
      expect(txMock.productionPhase.updateMany).toHaveBeenCalledWith({
        where: { id: 'phase-1', recipeId: 'recipe-1', tenantId },
        data: { order: 2 },
      });
    });

    it('findPhaseInputById scopes by tenant and id', async () => {
      prismaMock.phaseInput.findFirst.mockResolvedValue(null);
      await repository.findPhaseInputById(tenantId, 'input-1');
      expect(prismaMock.phaseInput.findFirst).toHaveBeenCalledWith({
        where: { id: 'input-1', tenantId },
      });
    });

    it('createPhaseInput defaults isOptional to false', async () => {
      prismaMock.phaseInput.create.mockResolvedValue({ id: 'input-1' });
      await repository.createPhaseInput({
        tenantId,
        phaseId: 'phase-1',
        supplyItemId: 'supply-1',
        quantityPerBatch: new Decimal('1'),
        unit: StockUnit.KILOGRAMS,
      });
      expect(prismaMock.phaseInput.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isOptional: false }),
      });
    });

    it('deletePhaseInput throws when input is missing', async () => {
      prismaMock.phaseInput.findFirst.mockResolvedValue(null);
      await expect(repository.deletePhaseInput(tenantId, 'phase-1', 'input-1')).rejects.toThrow(
        'Phase input not found: input-1',
      );
    });

    it('deletePhaseInput deletes existing input', async () => {
      prismaMock.phaseInput.findFirst.mockResolvedValue({
        id: 'input-1',
        phaseId: 'phase-1',
        tenantId,
      });
      prismaMock.phaseInput.delete.mockResolvedValue({ id: 'input-1' });

      const result = await repository.deletePhaseInput(tenantId, 'phase-1', 'input-1');

      expect(prismaMock.phaseInput.delete).toHaveBeenCalledWith({ where: { id: 'input-1' } });
      expect(result).toEqual({ id: 'input-1' });
    });
  });

  describe('production orders', () => {
    it('createOrderWithExecutionsTx creates order and one PENDING execution per phase', async () => {
      const plannedStartAt = new Date('2026-05-27T08:00:00Z');
      const plannedEndAt = new Date('2026-05-27T12:00:00Z');
      const order = { id: 'order-1', tenantId, number: '2026-1' };

      txMock.productionOrder.create.mockResolvedValue(order);
      txMock.productionPhase.findMany.mockResolvedValue([
        {
          id: 'phase-1',
          workStationId: 'ws-1',
          standardMinutes: 15,
        },
        {
          id: 'phase-2',
          workStationId: 'ws-2',
          standardMinutes: 25,
        },
      ]);
      txMock.phaseExecution.create
        .mockResolvedValueOnce({ id: 'exec-1', status: PhaseExecutionStatus.PENDING })
        .mockResolvedValueOnce({ id: 'exec-2', status: PhaseExecutionStatus.PENDING });

      const result = await repository.createOrderWithExecutionsTx({
        tenantId,
        number: '2026-1',
        recipeId: 'recipe-1',
        recipeVersion: 1,
        batchCount: 2,
        shift: 'MORNING' as never,
        priority: 'NORMAL' as never,
        plannedQuantity: new Decimal('20'),
        unit: StockUnit.UNIT,
        plannedStartAt,
        plannedEndAt,
        supervisorId: null,
        notes: null,
      });

      expect(txMock.productionOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          number: '2026-1',
          status: 'DRAFT',
        }),
      });
      expect(txMock.phaseExecution.create).toHaveBeenCalledTimes(2);
      expect(txMock.phaseExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          orderId: 'order-1',
          phaseId: 'phase-1',
          status: PhaseExecutionStatus.PENDING,
          plannedMinutes: 30,
        }),
      });
      expect(result.executions).toHaveLength(2);
    });

    it('findOrders scopes by tenant and optional filters', async () => {
      prismaMock.productionOrder.findMany.mockResolvedValue([]);
      const from = new Date('2026-05-01T00:00:00Z');
      const to = new Date('2026-05-31T23:59:59Z');

      await repository.findOrders(tenantId, {
        status: 'DRAFT' as never,
        shift: 'MORNING' as never,
        priority: 'NORMAL' as never,
        plannedStartFrom: from,
        plannedStartTo: to,
      });

      expect(prismaMock.productionOrder.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          status: ProductionOrderStatus.DRAFT,
          shift: 'MORNING',
          priority: 'NORMAL',
          plannedStartAt: { gte: from, lte: to },
        },
        orderBy: { plannedStartAt: 'desc' },
      });
    });

    it('findOrderDetailById returns order with sessions', async () => {
      prismaMock.productionOrder.findFirst.mockResolvedValue({
        id: 'order-1',
        tenantId,
        recipe: { id: 'recipe-1', name: 'Pan', packageWeight: null },
        executions: [],
        materials: [],
        byproducts: [],
        qualityChecks: [],
      });
      prismaMock.operatorSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          workStationId: 'ws-1',
          operatorUserId: 'op-1',
          phaseExecutionId: 'exec-1',
          startedAt: new Date(),
        },
      ]);

      const result = await repository.findOrderDetailById(tenantId, 'order-1');

      expect(result?.activeSessions).toHaveLength(1);
      expect(prismaMock.operatorSession.findMany).toHaveBeenCalled();
    });

    it('updateOrder throws when order is missing', async () => {
      prismaMock.productionOrder.findFirst.mockResolvedValue(null);

      await expect(
        repository.updateOrder(tenantId, 'missing', { status: ProductionOrderStatus.CANCELLED }),
      ).rejects.toThrow('Production order not found: missing');
    });

    it('updateExecution throws when execution is missing', async () => {
      prismaMock.phaseExecution.findFirst.mockResolvedValue(null);

      await expect(
        repository.updateExecution(tenantId, 'missing', {
          status: PhaseExecutionStatus.COMPLETED,
        }),
      ).rejects.toThrow('Phase execution not found: missing');
    });

    it('findExecutionById scopes by tenant and id', async () => {
      prismaMock.phaseExecution.findFirst.mockResolvedValue(null);
      await repository.findExecutionById(tenantId, 'exec-1');
      expect(prismaMock.phaseExecution.findFirst).toHaveBeenCalledWith({
        where: { id: 'exec-1', tenantId },
      });
    });

    it('updateOrder updates existing order', async () => {
      prismaMock.productionOrder.findFirst.mockResolvedValue({ id: 'order-1', tenantId });
      prismaMock.productionOrder.update.mockResolvedValue({
        id: 'order-1',
        status: ProductionOrderStatus.CANCELLED,
      });

      const result = await repository.updateOrder(tenantId, 'order-1', {
        status: ProductionOrderStatus.CANCELLED,
      });

      expect(result.status).toBe(ProductionOrderStatus.CANCELLED);
    });

    it('updateExecution updates existing execution', async () => {
      prismaMock.phaseExecution.findFirst.mockResolvedValue({ id: 'exec-1', tenantId });
      prismaMock.phaseExecution.update.mockResolvedValue({
        id: 'exec-1',
        status: PhaseExecutionStatus.READY,
      });

      const result = await repository.updateExecution(tenantId, 'exec-1', {
        status: PhaseExecutionStatus.READY,
      });

      expect(result.status).toBe(PhaseExecutionStatus.READY);
    });

    it('findOrderDetailById returns null when order is missing', async () => {
      prismaMock.productionOrder.findFirst.mockResolvedValue(null);

      await expect(repository.findOrderDetailById(tenantId, 'missing')).resolves.toBeNull();
    });

    it('replaceOrderMaterialsTx deletes existing rows and inserts snapshot lines', async () => {
      prismaMock.$transaction.mockImplementation(async (callback) => callback(txMock));
      txMock.productionOrderMaterial.deleteMany.mockResolvedValue({ count: 1 });
      txMock.productionOrderMaterial.createMany.mockResolvedValue({ count: 1 });

      await repository.replaceOrderMaterialsTx(tenantId, 'order-1', [
        {
          supplyItemId: 'supply-1',
          materialName: 'Harina',
          requiredQuantity: new Decimal('4'),
          unit: StockUnit.KILOGRAMS,
          sortOrder: 0,
        },
      ]);

      expect(txMock.productionOrderMaterial.deleteMany).toHaveBeenCalledWith({
        where: { tenantId, orderId: 'order-1' },
      });
      expect(txMock.productionOrderMaterial.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            tenantId,
            orderId: 'order-1',
            supplyItemId: 'supply-1',
            materialName: 'Harina',
            sortOrder: 0,
          }),
        ],
      });
    });

    it('replaceOrderMaterialsTx skips createMany when snapshot is empty', async () => {
      prismaMock.$transaction.mockImplementation(async (callback) => callback(txMock));
      txMock.productionOrderMaterial.deleteMany.mockResolvedValue({ count: 0 });

      await repository.replaceOrderMaterialsTx(tenantId, 'order-1', []);

      expect(txMock.productionOrderMaterial.deleteMany).toHaveBeenCalled();
      expect(txMock.productionOrderMaterial.createMany).not.toHaveBeenCalled();
    });
  });
});
