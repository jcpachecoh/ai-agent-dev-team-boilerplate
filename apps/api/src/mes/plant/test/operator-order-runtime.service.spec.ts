import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PhaseExecutionStatus,
  ProductionLogEvent,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
  StockUnit,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { OrderDetail } from '../interfaces/plant.interfaces';
import { PlantRepository } from '../repository/plant.repository';
import { ProductionLogRepository } from '../repository/production-log.repository';
import { OperatorOrderRuntimeService } from '../service/operator-order-runtime.service';
import { PhaseChainService } from '../service/phase-chain.service';
import { PlantEventsService } from '../service/plant-events.service';
import { PlantService } from '../service/plant.service';

const tenantId = 'palos-de-lena';
const orderId = 'order-1';
const operatorUserId = 'op-1';
const workStationId = 'ws-1';

const baseExecution = {
  id: 'exec-1',
  tenantId,
  orderId,
  phaseId: 'phase-1',
  workStationId,
  status: PhaseExecutionStatus.READY,
  plannedMinutes: 5,
  actualMinutes: null,
  efficiencyPct: null,
  producedQuantity: null,
  qaApprovedAt: null,
  qaApprovedBy: null,
  startedAt: null,
  completedAt: null,
  notes: null,
  operatorCount: null,
  deliveredQuantity: null,
  responsibleUserId: null,
  createdAt: new Date(),
  phase: {
    id: 'phase-1',
    order: 1,
    name: 'Mezclado',
    requiresQA: false,
    workStationId,
  },
};

function buildOrderDetail(
  status: ProductionOrderStatus,
  executionStatus: PhaseExecutionStatus,
): OrderDetail {
  return {
    id: orderId,
    tenantId,
    number: '0001',
    recipeId: 'recipe-1',
    recipeVersion: 1,
    status,
    priority: ProductionPriority.NORMAL,
    shift: ProductionShift.MORNING,
    batchCount: 2,
    plannedQuantity: new Decimal('20'),
    producedQuantity: null,
    unit: StockUnit.UNIT,
    plannedStartAt: new Date(),
    plannedEndAt: new Date(),
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
    recipe: { id: 'recipe-1', name: 'Pizza Margarita', packageWeight: null },
    committee: null,
    executions: [{ ...baseExecution, status: executionStatus }],
    activeSessions: [],
    materials: [],
    byproducts: [],
    qualityChecks: [],
  };
}

const plantRepositoryMock = {
  findOrderDetailById: jest.fn(),
  findRecipeDetailById: jest.fn(),
  findSupplyItemsWithPrincipalSupplier: jest.fn(),
  findWorkStationById: jest.fn(),
  updateOrder: jest.fn(),
  updateExecution: jest.fn(),
};

const productionLogRepositoryMock = {
  append: jest.fn(),
  findByIdempotencyKey: jest.fn(),
  findLastByOrder: jest.fn(),
  findLastByOrderAndEvents: jest.fn(),
  findByOrder: jest.fn(),
};

const phaseChainServiceMock = {
  completeExecution: jest.fn(),
};

const plantEventsServiceMock = {
  emitPhaseStatusChanges: jest.fn(),
};

const plantServiceMock = {
  findOrderById: jest.fn(),
};

describe('OperatorOrderRuntimeService', () => {
  let service: OperatorOrderRuntimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorOrderRuntimeService,
        { provide: PlantRepository, useValue: plantRepositoryMock },
        { provide: ProductionLogRepository, useValue: productionLogRepositoryMock },
        { provide: PhaseChainService, useValue: phaseChainServiceMock },
        { provide: PlantEventsService, useValue: plantEventsServiceMock },
        { provide: PlantService, useValue: plantServiceMock },
      ],
    }).compile();

    service = module.get(OperatorOrderRuntimeService);
    jest.clearAllMocks();
    plantRepositoryMock.findOrderDetailById.mockReset();
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.IN_PROCESS, PhaseExecutionStatus.IN_PROCESS),
    );
    productionLogRepositoryMock.findByIdempotencyKey.mockResolvedValue(null);
    productionLogRepositoryMock.findByOrder.mockResolvedValue([]);
    plantRepositoryMock.findWorkStationById.mockResolvedValue({
      id: workStationId,
      name: 'Parrilla',
      code: 'EST-04',
    });
    plantServiceMock.findOrderById.mockResolvedValue({ id: orderId });
  });

  it('startOrder moves PLANNED order to IN_PROCESS and logs ORDER_STARTED', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.PLANNED, PhaseExecutionStatus.READY),
    );

    await service.startOrder(tenantId, orderId, { operatorUserId }, { workStationId });

    expect(plantRepositoryMock.updateOrder).toHaveBeenCalledWith(
      tenantId,
      orderId,
      expect.objectContaining({ status: ProductionOrderStatus.IN_PROCESS }),
    );
    expect(plantRepositoryMock.updateExecution).toHaveBeenCalledWith(
      tenantId,
      'exec-1',
      expect.objectContaining({
        status: PhaseExecutionStatus.IN_PROCESS,
        responsibleUserId: operatorUserId,
      }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({
        event: ProductionLogEvent.ORDER_STARTED,
        employeeId: operatorUserId,
      }),
    );
  });

  it('startOrder throws when order is not PLANNED', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.IN_PROCESS, PhaseExecutionStatus.IN_PROCESS),
    );

    await expect(
      service.startOrder(tenantId, orderId, { operatorUserId }, { workStationId }),
    ).rejects.toThrow(ConflictException);
  });

  it('startOrder throws when no execution is READY', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.PLANNED, PhaseExecutionStatus.PENDING),
    );

    await expect(
      service.startOrder(tenantId, orderId, { operatorUserId }, { workStationId }),
    ).rejects.toThrow('No phase execution is ready to start');
  });

  it('startOrder throws when workStationId does not match the ready execution', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.PLANNED, PhaseExecutionStatus.READY),
    );

    await expect(
      service.startOrder(tenantId, orderId, { operatorUserId }, { workStationId: 'ws-other' }),
    ).rejects.toThrow('workStationId does not match the current phase station');
  });

  it('pauseOrderByOperator throws when order is not in progress', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.PAUSED),
    );

    await expect(
      service.pauseOrderByOperator(tenantId, orderId, { operatorUserId }, {}),
    ).rejects.toThrow('Cannot pause order in status PAUSED');
  });

  it('resumeOrderByOperator throws when order is not paused', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.IN_PROCESS, PhaseExecutionStatus.IN_PROCESS),
    );

    await expect(
      service.resumeOrderByOperator(tenantId, orderId, { operatorUserId }),
    ).rejects.toThrow('Cannot resume order in status IN_PROCESS');
  });

  it('resumeOrderByOperator returns existing order when idempotency key was already processed', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.PAUSED),
    );
    productionLogRepositoryMock.findByIdempotencyKey.mockResolvedValue({ id: 'log-resume' });

    await service.resumeOrderByOperator(tenantId, orderId, {
      operatorUserId,
      idempotencyKey: 'idem-resume',
    });

    expect(plantRepositoryMock.updateOrder).not.toHaveBeenCalled();
    expect(plantServiceMock.findOrderById).toHaveBeenCalledWith(tenantId, orderId);
  });

  it('completeStep throws when READY step belongs to a PLANNED order', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.PLANNED, PhaseExecutionStatus.READY),
    );

    await expect(
      service.completeStep(tenantId, orderId, { operatorUserId }, { stepId: 'exec-1' }),
    ).rejects.toThrow('Start the order first');
  });

  it('getOrderRecipeView maps paused order status', async () => {
    const paused = buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.PAUSED);

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(paused);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.status).toBe('paused');
  });

  it('pauseOrderByOperator resolves workStationId from active session fallback', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    detail.executions = [];
    detail.activeSessions = [
      { workStationId: 'ws-session' } as OrderDetail['activeSessions'][number],
    ];

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);
    productionLogRepositoryMock.findLastByOrderAndEvents.mockResolvedValue(null);

    await service.pauseOrderByOperator(tenantId, orderId, { operatorUserId }, {});

    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ workStationId: 'ws-session' }),
    );
  });

  it('getOrderRecipeView marks completed phases as completed', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    detail.executions = [
      {
        ...baseExecution,
        id: 'exec-1',
        status: PhaseExecutionStatus.COMPLETED,
        completedAt: new Date(),
        phase: { ...baseExecution.phase, order: 1 },
      },
      {
        ...baseExecution,
        id: 'exec-2',
        phaseId: 'phase-2',
        status: PhaseExecutionStatus.IN_PROCESS,
        startedAt: new Date(),
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId,
        },
      },
    ];

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
        {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          standardMinutes: 8,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.phases[0]?.status).toBe('completed');
    expect(view.phases[1]?.status).toBe('current');
  });

  it('getOrderRecipeView returns undefined elapsedSeconds when order has not started', async () => {
    const planned = buildOrderDetail(ProductionOrderStatus.PLANNED, PhaseExecutionStatus.READY);
    planned.actualStartAt = null;

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(planned);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.elapsedSeconds).toBeUndefined();
  });

  it('completeStep throws when step does not belong to the order', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.IN_PROCESS, PhaseExecutionStatus.IN_PROCESS),
    );

    await expect(
      service.completeStep(tenantId, orderId, { operatorUserId }, { stepId: 'missing-step' }),
    ).rejects.toThrow('Step missing-step not found on this order');
  });

  it('completeStep resumes a paused execution before completing it', async () => {
    const paused = buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.PAUSED);
    const inProcess = {
      ...paused,
      status: ProductionOrderStatus.IN_PROCESS,
      executions: [
        {
          ...paused.executions[0]!,
          status: PhaseExecutionStatus.IN_PROCESS,
          startedAt: new Date(Date.now() - 90_000),
        },
      ],
    };

    plantRepositoryMock.findOrderDetailById
      .mockResolvedValueOnce(paused)
      .mockResolvedValueOnce(inProcess);
    phaseChainServiceMock.completeExecution.mockResolvedValue({
      orderId,
      changedExecutions: [],
    });

    await service.completeStep(
      tenantId,
      orderId,
      { operatorUserId },
      { stepId: 'exec-1', actualMinutes: 2 },
    );

    expect(plantRepositoryMock.updateOrder).toHaveBeenCalledWith(
      tenantId,
      orderId,
      expect.objectContaining({ status: ProductionOrderStatus.IN_PROCESS }),
    );
    expect(plantRepositoryMock.updateExecution).toHaveBeenCalledWith(
      tenantId,
      'exec-1',
      expect.objectContaining({ status: PhaseExecutionStatus.IN_PROCESS }),
    );
  });

  it('finishOrder throws when order is cancelled', async () => {
    const cancelled = buildOrderDetail(
      ProductionOrderStatus.CANCELLED,
      PhaseExecutionStatus.COMPLETED,
    );
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(cancelled);

    await expect(service.finishOrder(tenantId, orderId, { operatorUserId }, {})).rejects.toThrow(
      'Cannot finish a cancelled order',
    );
  });

  it('finishOrder returns existing order when idempotency key was already processed', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.COMPLETED,
    );
    detail.executions[0] = {
      ...detail.executions[0]!,
      completedAt: new Date(),
    };
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);
    productionLogRepositoryMock.findByIdempotencyKey.mockResolvedValue({ id: 'log-finish' });

    await service.finishOrder(
      tenantId,
      orderId,
      { operatorUserId, idempotencyKey: 'idem-finish' },
      {},
    );

    expect(plantRepositoryMock.updateOrder).not.toHaveBeenCalled();
    expect(plantServiceMock.findOrderById).toHaveBeenCalledWith(tenantId, orderId);
  });

  it('completeStep throws when execution is already completed', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.COMPLETED,
    );
    detail.executions[0] = {
      ...detail.executions[0]!,
      completedAt: new Date(),
    };
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);

    await expect(
      service.completeStep(tenantId, orderId, { operatorUserId }, { stepId: 'exec-1' }),
    ).rejects.toThrow('Cannot complete step in status COMPLETED');
  });

  it('getOrderRecipeView marks non-current phases as pending', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    detail.executions = [
      {
        ...baseExecution,
        id: 'exec-1',
        status: PhaseExecutionStatus.IN_PROCESS,
        phase: { ...baseExecution.phase, order: 1 },
      },
      {
        ...baseExecution,
        id: 'exec-2',
        phaseId: 'phase-2',
        status: PhaseExecutionStatus.PENDING,
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId,
        },
      },
    ];

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
        {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          standardMinutes: 8,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.phases[0]?.status).toBe('current');
    expect(view.phases[1]?.status).toBe('pending');
  });

  it('getOrderRecipeView subtracts completed pause intervals from elapsedSeconds', async () => {
    const inProcess = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    inProcess.actualStartAt = new Date(Date.now() - 600_000);
    const pausedAt = new Date(Date.now() - 300_000);
    const resumedAt = new Date(Date.now() - 240_000);

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(inProcess);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);
    productionLogRepositoryMock.findByOrder.mockResolvedValue([
      { event: ProductionLogEvent.ORDER_PAUSED, timestamp: pausedAt },
      { event: ProductionLogEvent.ORDER_RESUMED, timestamp: resumedAt },
    ]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.elapsedSeconds).toBeLessThan(600);
    expect(view.elapsedSeconds).toBeGreaterThan(450);
  });

  it('pause and resume operator flow updates statuses and logs events', async () => {
    plantRepositoryMock.findOrderDetailById
      .mockResolvedValueOnce(
        buildOrderDetail(ProductionOrderStatus.IN_PROCESS, PhaseExecutionStatus.IN_PROCESS),
      )
      .mockResolvedValueOnce(
        buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.PAUSED),
      );

    productionLogRepositoryMock.findLastByOrderAndEvents.mockResolvedValue({
      timestamp: new Date(Date.now() - 60_000),
    });

    await service.pauseOrderByOperator(tenantId, orderId, { operatorUserId }, {});
    await service.resumeOrderByOperator(tenantId, orderId, { operatorUserId });

    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.ORDER_PAUSED }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.ORDER_RESUMED }),
    );
  });

  it('completeStep delegates to phase chain and logs STEP_COMPLETED', async () => {
    const inProcess = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    inProcess.executions[0] = {
      ...inProcess.executions[0]!,
      startedAt: new Date(Date.now() - 120_000),
    };
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(inProcess);

    await service.completeStep(
      tenantId,
      orderId,
      { operatorUserId },
      { stepId: 'exec-1', actualMinutes: 2 },
    );

    expect(phaseChainServiceMock.completeExecution).toHaveBeenCalledWith(
      tenantId,
      'exec-1',
      expect.objectContaining({ actualMinutes: 2 }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.STEP_COMPLETED }),
    );
  });

  it('completeStep reverts premature order completion when later steps remain', async () => {
    const inProcess = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    inProcess.executions = [
      {
        ...baseExecution,
        id: 'exec-1',
        status: PhaseExecutionStatus.IN_PROCESS,
        startedAt: new Date(Date.now() - 120_000),
        phase: { ...baseExecution.phase, order: 1 },
      },
      {
        ...baseExecution,
        id: 'exec-2',
        phaseId: 'phase-2',
        status: PhaseExecutionStatus.PENDING,
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Cocción',
          requiresQA: false,
          workStationId,
        },
      },
      {
        ...baseExecution,
        id: 'exec-3',
        phaseId: 'phase-3',
        status: PhaseExecutionStatus.PENDING,
        phase: {
          id: 'phase-3',
          order: 3,
          name: 'Porcionado',
          requiresQA: false,
          workStationId,
        },
      },
    ];
    const incorrectlyCompleted: OrderDetail = {
      ...inProcess,
      status: ProductionOrderStatus.COMPLETED,
      executions: [
        { ...inProcess.executions[0]!, status: PhaseExecutionStatus.COMPLETED },
        { ...inProcess.executions[1]!, status: PhaseExecutionStatus.IN_PROCESS },
        inProcess.executions[2]!,
      ],
    };

    plantRepositoryMock.findOrderDetailById
      .mockResolvedValueOnce(inProcess)
      .mockResolvedValueOnce(inProcess)
      .mockResolvedValueOnce(incorrectlyCompleted);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      phases: [{ id: 'phase-1' }, { id: 'phase-2' }, { id: 'phase-3' }],
    });

    await service.completeStep(
      tenantId,
      orderId,
      { operatorUserId },
      { stepId: 'exec-1', actualMinutes: 2 },
    );

    expect(plantRepositoryMock.updateOrder).toHaveBeenCalledWith(tenantId, orderId, {
      status: ProductionOrderStatus.IN_PROCESS,
      actualEndAt: null,
    });
  });

  it('finishOrder requires intermediate steps to be completed first', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    detail.executions = [
      {
        ...baseExecution,
        id: 'exec-1',
        status: PhaseExecutionStatus.IN_PROCESS,
        phase: { ...baseExecution.phase, order: 1 },
      },
      {
        ...baseExecution,
        id: 'exec-2',
        phaseId: 'phase-2',
        status: PhaseExecutionStatus.PENDING,
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId,
        },
      },
    ];
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);

    await expect(service.finishOrder(tenantId, orderId, { operatorUserId }, {})).rejects.toThrow(
      ConflictException,
    );

    expect(phaseChainServiceMock.completeExecution).not.toHaveBeenCalled();
  });

  it('finishOrder auto-completes the last active step before closing the order', async () => {
    const inProcessLastStep = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    inProcessLastStep.executions = [
      {
        ...baseExecution,
        id: 'exec-1',
        status: PhaseExecutionStatus.COMPLETED,
        completedAt: new Date(),
        phase: { ...baseExecution.phase, order: 1 },
      },
      {
        ...baseExecution,
        id: 'exec-2',
        phaseId: 'phase-2',
        status: PhaseExecutionStatus.IN_PROCESS,
        startedAt: new Date(Date.now() - 120_000),
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId,
        },
      },
    ];
    const allCompleted = {
      ...inProcessLastStep,
      status: ProductionOrderStatus.COMPLETED,
      executions: inProcessLastStep.executions.map((execution) => ({
        ...execution,
        status: PhaseExecutionStatus.COMPLETED,
        completedAt: new Date(),
      })),
    };

    plantRepositoryMock.findOrderDetailById
      .mockResolvedValueOnce(inProcessLastStep)
      .mockResolvedValueOnce(inProcessLastStep)
      .mockResolvedValueOnce(allCompleted);

    phaseChainServiceMock.completeExecution.mockResolvedValue({
      orderId,
      changedExecutions: [],
    });

    await service.finishOrder(tenantId, orderId, { operatorUserId }, { actualMinutes: 20 });

    expect(phaseChainServiceMock.completeExecution).toHaveBeenCalledWith(
      tenantId,
      'exec-2',
      expect.objectContaining({ actualMinutes: 20 }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.STEP_COMPLETED }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.ORDER_COMPLETED }),
    );
  });

  it('completeStep auto-starts READY step when order is PAUSED', async () => {
    const paused = buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.READY);
    plantRepositoryMock.findOrderDetailById.mockResolvedValueOnce(paused).mockResolvedValueOnce({
      ...paused,
      status: ProductionOrderStatus.IN_PROCESS,
      executions: [
        {
          ...paused.executions[0]!,
          status: PhaseExecutionStatus.IN_PROCESS,
          startedAt: new Date(),
        },
      ],
    });

    phaseChainServiceMock.completeExecution.mockResolvedValue({
      orderId,
      changedExecutions: [],
    });

    await service.completeStep(
      tenantId,
      orderId,
      { operatorUserId },
      { stepId: 'exec-1', actualMinutes: 19 },
    );

    expect(plantRepositoryMock.updateOrder).toHaveBeenCalledWith(
      tenantId,
      orderId,
      expect.objectContaining({ status: ProductionOrderStatus.IN_PROCESS }),
    );
    expect(plantRepositoryMock.updateExecution).toHaveBeenCalledWith(
      tenantId,
      'exec-1',
      expect.objectContaining({ status: PhaseExecutionStatus.IN_PROCESS }),
    );
    expect(phaseChainServiceMock.completeExecution).toHaveBeenCalled();
  });

  it('getOrderRecipeView returns completed status and marks all phases completed', async () => {
    const completed = buildOrderDetail(
      ProductionOrderStatus.COMPLETED,
      PhaseExecutionStatus.COMPLETED,
    );
    completed.executions[0] = {
      ...completed.executions[0]!,
      completedAt: new Date(),
    };

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(completed);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.status).toBe('completed');
    expect(view.phases.every((phase) => phase.status === 'completed')).toBe(true);
    expect(view.currentPhaseIndex).toBe(1);
    expect(view.stationName).toBe('Parrilla');
    expect(view.currentStepId).toBeUndefined();
  });

  it('getOrderRecipeView does not mark recipe phases as current when no execution is active', async () => {
    const completedPhase1 = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.COMPLETED,
    );

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(completedPhase1);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
        {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          standardMinutes: 10,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.currentStepId).toBeUndefined();
    expect(view.phases.find((phase) => phase.index === 2)?.status).toBe('pending');
    expect(view.phases.filter((phase) => phase.status === 'current')).toHaveLength(0);
  });

  it('getOrderRecipeView exposes currentStepId from the active execution', async () => {
    const inProcess = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(inProcess);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.currentStepId).toBe('exec-1');
    expect(view.phases[0]?.executionId).toBe('exec-1');
  });

  it('getOrderRecipeView throws when recipe is missing', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.IN_PROCESS, PhaseExecutionStatus.IN_PROCESS),
    );
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue(null);

    await expect(service.getOrderRecipeView(tenantId, orderId)).rejects.toThrow(
      'Recipe recipe-1 not found',
    );
  });

  it('getOrderRecipeView flags ingredient stock warnings and tolerates log lookup failures', async () => {
    const inProcess = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    inProcess.actualStartAt = new Date(Date.now() - 120_000);

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(inProcess);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: 'Mezclar',
          inputs: [
            {
              supplyItemId: 'supply-1',
              quantityPerBatch: new Decimal('10'),
              unit: StockUnit.GRAMS,
            },
          ],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([
      {
        id: 'supply-1',
        nombre: 'Harina',
        stockActualBodega: new Decimal('1'),
        supplierProducts: [{ supplier: { razonSocial: 'Proveedor SA' } }],
      },
    ]);
    productionLogRepositoryMock.findByOrder.mockRejectedValue(new Error('logs unavailable'));

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.phases[0]?.ingredients[0]?.stockWarning).toBe(true);
    expect(view.phases[0]?.ingredients[0]?.supplier).toBe('Proveedor SA');
    expect(view.elapsedSeconds).toBeGreaterThan(0);
  });

  it('getOrderRecipeView subtracts paused time from elapsedSeconds', async () => {
    const paused = buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.PAUSED);
    paused.actualStartAt = new Date(Date.now() - 600_000);
    const pausedAt = new Date(Date.now() - 120_000);

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(paused);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);
    productionLogRepositoryMock.findByOrder.mockResolvedValue([
      { event: ProductionLogEvent.ORDER_PAUSED, timestamp: pausedAt },
    ]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.elapsedSeconds).toBeGreaterThan(400);
    expect(view.elapsedSeconds).toBeLessThan(600);
  });

  it('startOrder returns existing order when idempotency key was already processed', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.PLANNED, PhaseExecutionStatus.READY),
    );
    productionLogRepositoryMock.findByIdempotencyKey.mockResolvedValue({ id: 'log-1' });

    await service.startOrder(
      tenantId,
      orderId,
      { operatorUserId, idempotencyKey: 'idem-start' },
      { workStationId },
    );

    expect(plantRepositoryMock.updateOrder).not.toHaveBeenCalled();
    expect(plantServiceMock.findOrderById).toHaveBeenCalledWith(tenantId, orderId);
  });

  it('completeStep returns existing order when idempotency key was already processed', async () => {
    const inProcess = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(inProcess);
    productionLogRepositoryMock.findByIdempotencyKey.mockResolvedValue({ id: 'log-2' });

    await service.completeStep(
      tenantId,
      orderId,
      { operatorUserId, idempotencyKey: 'idem-step' },
      { stepId: 'exec-1' },
    );

    expect(phaseChainServiceMock.completeExecution).not.toHaveBeenCalled();
    expect(plantServiceMock.findOrderById).toHaveBeenCalledWith(tenantId, orderId);
  });

  it('pauseOrderByOperator returns existing order when idempotency key was already processed', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(
      buildOrderDetail(ProductionOrderStatus.IN_PROCESS, PhaseExecutionStatus.IN_PROCESS),
    );
    productionLogRepositoryMock.findByIdempotencyKey.mockResolvedValue({ id: 'log-3' });

    await service.pauseOrderByOperator(
      tenantId,
      orderId,
      { operatorUserId, idempotencyKey: 'idem-pause' },
      {},
    );

    expect(plantRepositoryMock.updateOrder).not.toHaveBeenCalled();
    expect(plantServiceMock.findOrderById).toHaveBeenCalledWith(tenantId, orderId);
  });

  it('getOrderRecipeView throws when order is missing', async () => {
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(null);

    await expect(service.getOrderRecipeView(tenantId, orderId)).rejects.toThrow(NotFoundException);
  });

  it('getOrderRecipeView exposes currentStepId from QA_PENDING execution', async () => {
    const qaPending = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.QA_PENDING,
    );

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(qaPending);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.currentStepId).toBe('exec-1');
  });

  it('getOrderRecipeView resolves the in-process step when earlier phases are already completed', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    detail.executions = [
      {
        ...baseExecution,
        id: 'exec-1',
        status: PhaseExecutionStatus.COMPLETED,
        completedAt: new Date(),
        phase: { ...baseExecution.phase, order: 1 },
      },
      {
        ...baseExecution,
        id: 'exec-2',
        phaseId: 'phase-2',
        status: PhaseExecutionStatus.IN_PROCESS,
        startedAt: new Date(),
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId,
        },
      },
    ];

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Pizza Margarita',
      phases: [
        {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          standardMinutes: 5,
          description: null,
          inputs: [],
        },
        {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          standardMinutes: 8,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.currentStepId).toBe('exec-2');
    expect(view.currentPhaseIndex).toBe(2);
  });

  it('getOrderRecipeView picks the latest active phase when multiple executions are in process', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    detail.executions = [
      {
        ...baseExecution,
        id: 'exec-2',
        phaseId: 'phase-2',
        status: PhaseExecutionStatus.IN_PROCESS,
        startedAt: new Date(),
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Marinado',
          requiresQA: false,
          workStationId,
        },
      },
      {
        ...baseExecution,
        id: 'exec-3',
        phaseId: 'phase-3',
        status: PhaseExecutionStatus.IN_PROCESS,
        startedAt: new Date(),
        phase: {
          id: 'phase-3',
          order: 3,
          name: 'Parrilla',
          requiresQA: false,
          workStationId,
        },
      },
    ];

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);
    plantRepositoryMock.findRecipeDetailById.mockResolvedValue({
      id: 'recipe-1',
      name: 'Costillas BBQ',
      phases: [
        {
          id: 'phase-2',
          order: 2,
          name: 'Marinado',
          standardMinutes: 25,
          description: null,
          inputs: [],
        },
        {
          id: 'phase-3',
          order: 3,
          name: 'Parrilla',
          standardMinutes: 30,
          description: null,
          inputs: [],
        },
      ],
    });
    plantRepositoryMock.findSupplyItemsWithPrincipalSupplier.mockResolvedValue([]);

    const view = await service.getOrderRecipeView(tenantId, orderId);

    expect(view.currentStepId).toBe('exec-3');
    expect(view.currentPhaseIndex).toBe(3);
  });

  it('appendNoveltyLog writes NOVELTY_ADDED production log', async () => {
    await service.appendNoveltyLog(
      tenantId,
      orderId,
      operatorUserId,
      workStationId,
      'Falta material',
    );

    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({
        event: ProductionLogEvent.NOVELTY_ADDED,
        employeeId: operatorUserId,
        workStationId,
        notes: 'Falta material',
      }),
    );
  });

  it('finishOrder throws when QA approval is still pending', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.QA_PENDING,
    );
    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);

    await expect(service.finishOrder(tenantId, orderId, { operatorUserId }, {})).rejects.toThrow(
      'QA approval is required before finishing the order',
    );
  });

  it('finishOrder marks IN_PROCESS order completed when every step is done', async () => {
    const detail = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.COMPLETED,
    );
    detail.executions[0] = {
      ...detail.executions[0]!,
      completedAt: new Date(),
    };

    plantRepositoryMock.findOrderDetailById.mockResolvedValue(detail);
    productionLogRepositoryMock.findLastByOrderAndEvents.mockResolvedValue({
      timestamp: new Date(Date.now() - 60_000),
    });

    await service.finishOrder(tenantId, orderId, { operatorUserId }, { notes: 'Listo' });

    expect(plantRepositoryMock.updateOrder).toHaveBeenCalledWith(
      tenantId,
      orderId,
      expect.objectContaining({ status: ProductionOrderStatus.COMPLETED }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({
        event: ProductionLogEvent.ORDER_COMPLETED,
        notes: 'Listo',
        workStationId,
      }),
    );
  });

  it('runs plan → start → pause → resume → complete-step → finish with logs', async () => {
    const planned = buildOrderDetail(ProductionOrderStatus.PLANNED, PhaseExecutionStatus.READY);
    const inProcess = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.IN_PROCESS,
    );
    inProcess.executions[0] = {
      ...inProcess.executions[0]!,
      startedAt: new Date(Date.now() - 180_000),
    };
    const paused = buildOrderDetail(ProductionOrderStatus.PAUSED, PhaseExecutionStatus.PAUSED);
    const readyToFinish = buildOrderDetail(
      ProductionOrderStatus.IN_PROCESS,
      PhaseExecutionStatus.COMPLETED,
    );

    plantRepositoryMock.findOrderDetailById
      .mockResolvedValueOnce(planned)
      .mockResolvedValueOnce(inProcess)
      .mockResolvedValueOnce(paused)
      .mockResolvedValueOnce(inProcess)
      .mockResolvedValueOnce(inProcess)
      .mockResolvedValueOnce(inProcess)
      .mockResolvedValueOnce(readyToFinish)
      .mockResolvedValueOnce(readyToFinish);

    productionLogRepositoryMock.findLastByOrderAndEvents.mockResolvedValue({
      timestamp: new Date(Date.now() - 60_000),
    });
    phaseChainServiceMock.completeExecution.mockResolvedValue({
      orderId,
      changedExecutions: [],
    });

    await service.startOrder(tenantId, orderId, { operatorUserId }, { workStationId });
    await service.pauseOrderByOperator(tenantId, orderId, { operatorUserId }, {});
    await service.resumeOrderByOperator(tenantId, orderId, { operatorUserId });
    await service.completeStep(
      tenantId,
      orderId,
      { operatorUserId },
      { stepId: 'exec-1', actualMinutes: 3 },
    );
    await service.finishOrder(tenantId, orderId, { operatorUserId }, {});

    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.ORDER_STARTED }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.STEP_COMPLETED }),
    );
    expect(productionLogRepositoryMock.append).toHaveBeenCalledWith(
      expect.objectContaining({ event: ProductionLogEvent.ORDER_COMPLETED }),
    );
    expect(plantEventsServiceMock.emitPhaseStatusChanges).toHaveBeenCalled();
  });
});
