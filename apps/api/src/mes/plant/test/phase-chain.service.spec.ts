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
import { PlantRepository } from '../repository/plant.repository';
import { PhaseChainService } from '../service/phase-chain.service';
import { PlantEventsService } from '../service/plant-events.service';
import type { OrderDetail } from '../interfaces/plant.interfaces';

const tenantId = 'palos-de-lena';
const orderId = 'order-1';

const repoMock = {
  findExecutionById: jest.fn(),
  findOrderDetailById: jest.fn(),
  updateExecution: jest.fn(),
  updateOrder: jest.fn(),
};

const plantEventsServiceMock = {
  emitPhaseStatusChanges: jest.fn(),
  emitPhaseStatusChanged: jest.fn(),
};

const buildExecution = (
  execution: Partial<OrderDetail['executions'][number]> &
    Pick<OrderDetail['executions'][number], 'id' | 'status' | 'phase'>,
): OrderDetail['executions'][number] => ({
  tenantId,
  orderId,
  phaseId: 'phase-1',
  workStationId: 'ws-1',
  plannedMinutes: 30,
  actualMinutes: null,
  producedQuantity: null,
  efficiencyPct: null,
  qaApprovedAt: null,
  qaApprovedBy: null,
  completedAt: null,
  notes: null,
  createdAt: new Date(),
  ...execution,
});

const buildOrderDetail = (
  executions: Array<
    Partial<OrderDetail['executions'][number]> &
      Pick<OrderDetail['executions'][number], 'id' | 'status' | 'phase'>
  >,
  status: ProductionOrderStatus = ProductionOrderStatus.IN_PROCESS,
): OrderDetail => ({
  id: orderId,
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
  plannedStartAt: new Date('2026-05-27T08:00:00Z'),
  plannedEndAt: new Date('2026-05-27T12:00:00Z'),
  actualStartAt: null,
  actualEndAt: null,
  supervisorId: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  recipe: { id: 'recipe-1', name: 'Pan integral' },
  executions: executions.map((execution) => buildExecution(execution)),
  activeSessions: [],
});

describe('PhaseChainService', () => {
  let service: PhaseChainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhaseChainService,
        { provide: PlantRepository, useValue: repoMock },
        { provide: PlantEventsService, useValue: plantEventsServiceMock },
      ],
    }).compile();

    service = module.get<PhaseChainService>(PhaseChainService);
    jest.clearAllMocks();
  });

  describe('completeExecution', () => {
    it('promotes next execution to READY when completed phase does not require QA', async () => {
      const exec1 = buildExecution({
        id: 'exec-1',
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.IN_PROCESS,
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: false,
          workStationId: 'ws-1',
        },
      });
      const exec2 = buildExecution({
        id: 'exec-2',
        phaseId: 'phase-2',
        workStationId: 'ws-2',
        status: PhaseExecutionStatus.PENDING,
        plannedMinutes: 20,
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId: 'ws-2',
        },
      });

      repoMock.findExecutionById.mockResolvedValue(exec1);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1, exec2]));

      const result = await service.completeExecution(tenantId, 'exec-1', {});

      expect(repoMock.updateExecution).toHaveBeenCalledWith(tenantId, 'exec-1', {
        status: PhaseExecutionStatus.COMPLETED,
        completedAt: expect.any(Date),
        actualMinutes: null,
        producedQuantity: null,
        notes: null,
      });
      expect(repoMock.updateExecution).toHaveBeenCalledWith(tenantId, 'exec-2', {
        status: PhaseExecutionStatus.READY,
      });
      expect(result.changedExecutions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'exec-1', status: PhaseExecutionStatus.COMPLETED }),
          expect.objectContaining({ id: 'exec-2', status: PhaseExecutionStatus.READY }),
        ]),
      );
      expect(plantEventsServiceMock.emitPhaseStatusChanges).toHaveBeenCalledWith(
        tenantId,
        result.changedExecutions,
      );
      expect(repoMock.updateOrder).not.toHaveBeenCalled();
    });

    it('promotes next execution to QA_PENDING when completed phase requires QA', async () => {
      const exec1 = {
        id: 'exec-1',
        tenantId,
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.IN_PROCESS,
        plannedMinutes: 30,
        actualMinutes: null,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: true,
          workStationId: 'ws-1',
        },
      };
      const exec2 = {
        id: 'exec-2',
        tenantId,
        orderId,
        phaseId: 'phase-2',
        workStationId: 'ws-2',
        status: PhaseExecutionStatus.PENDING,
        plannedMinutes: 20,
        actualMinutes: null,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId: 'ws-2',
        },
      };

      repoMock.findExecutionById.mockResolvedValue(exec1);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1, exec2]));

      const result = await service.completeExecution(tenantId, 'exec-1', {});

      expect(repoMock.updateExecution).toHaveBeenCalledWith(tenantId, 'exec-2', {
        status: PhaseExecutionStatus.QA_PENDING,
      });
      expect(result.changedExecutions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'exec-2', status: PhaseExecutionStatus.QA_PENDING }),
        ]),
      );
    });

    it('marks order COMPLETED when last phase execution is completed', async () => {
      const exec1 = {
        id: 'exec-1',
        tenantId,
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.COMPLETED,
        plannedMinutes: 30,
        actualMinutes: 25,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: false,
          workStationId: 'ws-1',
        },
      };
      const exec2 = {
        id: 'exec-2',
        tenantId,
        orderId,
        phaseId: 'phase-2',
        workStationId: 'ws-2',
        status: PhaseExecutionStatus.IN_PROCESS,
        plannedMinutes: 20,
        actualMinutes: null,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId: 'ws-2',
        },
      };

      repoMock.findExecutionById.mockResolvedValue(exec2);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1, exec2]));

      await service.completeExecution(tenantId, 'exec-2', { actualMinutes: 18 });

      expect(repoMock.updateOrder).toHaveBeenCalledWith(tenantId, orderId, {
        status: ProductionOrderStatus.COMPLETED,
        actualEndAt: expect.any(Date),
      });
    });

    it('throws ConflictException when order is cancelled', async () => {
      repoMock.findExecutionById.mockResolvedValue({
        id: 'exec-1',
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
      });
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail([], ProductionOrderStatus.CANCELLED),
      );

      await expect(service.completeExecution(tenantId, 'exec-1', {})).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws BadRequestException when execution is not IN_PROCESS', async () => {
      const exec1 = {
        id: 'exec-1',
        tenantId,
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.READY,
        plannedMinutes: 30,
        actualMinutes: null,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: false,
          workStationId: 'ws-1',
        },
      };

      repoMock.findExecutionById.mockResolvedValue(exec1);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1]));

      await expect(service.completeExecution(tenantId, 'exec-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when execution is missing', async () => {
      repoMock.findExecutionById.mockResolvedValue(null);

      await expect(service.completeExecution(tenantId, 'missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when order detail is missing', async () => {
      repoMock.findExecutionById.mockResolvedValue({
        id: 'exec-1',
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
      });
      repoMock.findOrderDetailById.mockResolvedValue(null);

      await expect(service.completeExecution(tenantId, 'exec-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('qaApproveExecution', () => {
    it('promotes next QA_PENDING execution to READY', async () => {
      const exec1 = {
        id: 'exec-1',
        tenantId,
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.COMPLETED,
        plannedMinutes: 30,
        actualMinutes: 25,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: true,
          workStationId: 'ws-1',
        },
      };
      const exec2 = {
        id: 'exec-2',
        tenantId,
        orderId,
        phaseId: 'phase-2',
        workStationId: 'ws-2',
        status: PhaseExecutionStatus.QA_PENDING,
        plannedMinutes: 20,
        actualMinutes: null,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-2',
          order: 2,
          name: 'Horneado',
          requiresQA: false,
          workStationId: 'ws-2',
        },
      };

      repoMock.findExecutionById.mockResolvedValue(exec1);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1, exec2]));

      const result = await service.qaApproveExecution(tenantId, 'exec-1', 'supervisor-1', {
        notes: 'OK',
      });

      expect(repoMock.updateExecution).toHaveBeenCalledWith(
        tenantId,
        'exec-1',
        expect.objectContaining({
          qaApprovedBy: 'supervisor-1',
          qaApprovedAt: expect.any(Date),
          notes: 'OK',
        }),
      );
      expect(repoMock.updateExecution).toHaveBeenCalledWith(tenantId, 'exec-2', {
        status: PhaseExecutionStatus.READY,
      });
      expect(result.changedExecutions).toEqual([
        expect.objectContaining({
          id: 'exec-2',
          status: PhaseExecutionStatus.READY,
        }),
      ]);
      expect(plantEventsServiceMock.emitPhaseStatusChanges).toHaveBeenCalledWith(
        tenantId,
        result.changedExecutions,
      );
    });

    it('throws BadRequestException when phase does not require QA', async () => {
      const exec1 = {
        id: 'exec-1',
        tenantId,
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.COMPLETED,
        plannedMinutes: 30,
        actualMinutes: 25,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: false,
          workStationId: 'ws-1',
        },
      };

      repoMock.findExecutionById.mockResolvedValue(exec1);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1]));

      await expect(service.qaApproveExecution(tenantId, 'exec-1', 'supervisor-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when order is cancelled', async () => {
      repoMock.findExecutionById.mockResolvedValue({
        id: 'exec-1',
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
      });
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail([], ProductionOrderStatus.CANCELLED),
      );

      await expect(service.qaApproveExecution(tenantId, 'exec-1', 'supervisor-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws BadRequestException when QA was already approved', async () => {
      const exec1 = {
        id: 'exec-1',
        tenantId,
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.COMPLETED,
        plannedMinutes: 30,
        actualMinutes: 25,
        producedQuantity: null,
        qaApprovedAt: new Date(),
        qaApprovedBy: 'supervisor-0',
        completedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: true,
          workStationId: 'ws-1',
        },
      };

      repoMock.findExecutionById.mockResolvedValue(exec1);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1]));

      await expect(service.qaApproveExecution(tenantId, 'exec-1', 'supervisor-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when execution is not COMPLETED for QA', async () => {
      const exec1 = {
        id: 'exec-1',
        tenantId,
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.QA_PENDING,
        plannedMinutes: 30,
        actualMinutes: null,
        producedQuantity: null,
        qaApprovedAt: null,
        qaApprovedBy: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
        phase: {
          id: 'phase-1',
          order: 1,
          name: 'Mezclado',
          requiresQA: true,
          workStationId: 'ws-1',
        },
      };

      repoMock.findExecutionById.mockResolvedValue(exec1);
      repoMock.findOrderDetailById.mockResolvedValue(buildOrderDetail([exec1]));

      await expect(service.qaApproveExecution(tenantId, 'exec-1', 'supervisor-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when completing order is already COMPLETED', async () => {
      repoMock.findExecutionById.mockResolvedValue({
        id: 'exec-1',
        orderId,
        phaseId: 'phase-1',
        workStationId: 'ws-1',
      });
      repoMock.findOrderDetailById.mockResolvedValue(
        buildOrderDetail([], ProductionOrderStatus.COMPLETED),
      );

      await expect(service.completeExecution(tenantId, 'exec-1', {})).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
