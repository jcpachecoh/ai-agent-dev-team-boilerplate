import { Test, TestingModule } from '@nestjs/testing';
import {
  AlarmSeverity,
  PhaseExecutionStatus,
  PlantAlarmType,
  ProductionOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AlarmRepository, PLANT_ALARM_NOTIFICATION_STATUS } from '../repository/alarm.repository';

const tenantId = 'palos-de-lena';
const since = new Date('2026-05-28T10:00:00.000Z');
const now = new Date('2026-05-28T10:30:00.000Z');

const prismaMock = {
  phaseExecution: {
    findMany: jest.fn(),
  },
  productionOrder: {
    findMany: jest.fn(),
  },
  plantAlarmDispatch: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('AlarmRepository', () => {
  let repository: AlarmRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlarmRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<AlarmRepository>(AlarmRepository);
    jest.clearAllMocks();
  });

  describe('findActiveAlarmTenantIds', () => {
    it('returns distinct tenant ids from active executions and delayed orders', async () => {
      prismaMock.phaseExecution.findMany.mockResolvedValue([
        { tenantId: 'tenant-a' },
        { tenantId: 'tenant-b' },
      ]);
      prismaMock.productionOrder.findMany.mockResolvedValue([
        { tenantId: 'tenant-b' },
        { tenantId: 'tenant-c' },
      ]);

      const tenantIds = await repository.findActiveAlarmTenantIds(now);

      expect(prismaMock.phaseExecution.findMany).toHaveBeenCalledWith({
        where: { status: PhaseExecutionStatus.IN_PROCESS },
        distinct: ['tenantId'],
        select: { tenantId: true },
      });
      expect(tenantIds).toEqual(['tenant-a', 'tenant-b', 'tenant-c']);
    });
  });

  describe('findActiveExecutionsForAlarmScan', () => {
    it('queries IN_PROCESS executions with phase standardMinutes and active sessions', async () => {
      prismaMock.phaseExecution.findMany.mockResolvedValue([
        {
          id: 'exec-1',
          orderId: 'order-1',
          tenantId,
          workStationId: 'ws-1',
          status: PhaseExecutionStatus.IN_PROCESS,
          startedAt: new Date('2026-05-28T09:00:00.000Z'),
          phase: { standardMinutes: 30 },
          sessions: [{ startedAt: new Date('2026-05-28T09:05:00.000Z') }],
        },
      ]);

      const rows = await repository.findActiveExecutionsForAlarmScan(tenantId);

      expect(prismaMock.phaseExecution.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: PhaseExecutionStatus.IN_PROCESS },
        include: {
          phase: { select: { standardMinutes: true } },
          sessions: {
            where: { endedAt: null },
            orderBy: { startedAt: 'asc' },
            take: 1,
            select: { startedAt: true },
          },
        },
      });
      expect(rows).toEqual([
        {
          executionId: 'exec-1',
          orderId: 'order-1',
          tenantId,
          workStationId: 'ws-1',
          status: PhaseExecutionStatus.IN_PROCESS,
          startedAt: new Date('2026-05-28T09:00:00.000Z'),
          standardMinutes: 30,
          activeSessionStartedAt: new Date('2026-05-28T09:05:00.000Z'),
        },
      ]);
    });

    it('maps missing active session to null activeSessionStartedAt', async () => {
      prismaMock.phaseExecution.findMany.mockResolvedValue([
        {
          id: 'exec-2',
          orderId: 'order-1',
          tenantId,
          workStationId: 'ws-1',
          status: PhaseExecutionStatus.IN_PROCESS,
          startedAt: new Date('2026-05-28T09:00:00.000Z'),
          phase: { standardMinutes: 20 },
          sessions: [],
        },
      ]);

      const rows = await repository.findActiveExecutionsForAlarmScan(tenantId);

      expect(rows[0]?.activeSessionStartedAt).toBeNull();
    });
  });

  describe('findDelayedOrdersForAlarmScan', () => {
    it('queries non-terminal orders due within 30 minutes or overdue', async () => {
      prismaMock.productionOrder.findMany.mockResolvedValue([]);

      await repository.findDelayedOrdersForAlarmScan(tenantId, now);

      expect(prismaMock.productionOrder.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          status: {
            notIn: [ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CANCELLED],
          },
          plannedEndAt: { lte: new Date(now.getTime() + 30 * 60_000) },
        },
        include: expect.objectContaining({
          executions: expect.any(Object),
          recipe: expect.any(Object),
        }),
      });
    });

    it('excludes COMPLETED orders from delayed order scan (no OP_RETRASADA at repository layer)', async () => {
      prismaMock.productionOrder.findMany.mockResolvedValue([]);

      await repository.findDelayedOrdersForAlarmScan(tenantId, now);

      expect(prismaMock.productionOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              notIn: [ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CANCELLED],
            },
          }),
        }),
      );
    });

    it('prefers IN_PROCESS execution workStationId for representative station', async () => {
      prismaMock.productionOrder.findMany.mockResolvedValue([
        {
          id: 'order-1',
          tenantId,
          number: '2026-0001',
          status: ProductionOrderStatus.IN_PROCESS,
          plannedEndAt: new Date('2026-05-28T10:45:00.000Z'),
          executions: [
            {
              workStationId: 'ws-ready',
              status: PhaseExecutionStatus.READY,
              phase: { order: 1 },
            },
            {
              workStationId: 'ws-active',
              status: PhaseExecutionStatus.IN_PROCESS,
              phase: { order: 2 },
            },
          ],
          recipe: { phases: [{ workStationId: 'ws-recipe' }] },
        },
      ]);

      const rows = await repository.findDelayedOrdersForAlarmScan(tenantId, now);

      expect(rows[0]?.workStationId).toBe('ws-active');
    });

    it('falls back to highest-order non-completed execution station', async () => {
      prismaMock.productionOrder.findMany.mockResolvedValue([
        {
          id: 'order-2',
          tenantId,
          number: '2026-0002',
          status: ProductionOrderStatus.PLANNED,
          plannedEndAt: new Date('2026-05-28T10:45:00.000Z'),
          executions: [
            {
              workStationId: 'ws-low',
              status: PhaseExecutionStatus.READY,
              phase: { order: 1 },
            },
            {
              workStationId: 'ws-high',
              status: PhaseExecutionStatus.PAUSED,
              phase: { order: 3 },
            },
          ],
          recipe: { phases: [{ workStationId: 'ws-recipe' }] },
        },
      ]);

      const rows = await repository.findDelayedOrdersForAlarmScan(tenantId, now);

      expect(rows[0]?.workStationId).toBe('ws-high');
    });

    it('falls back to recipe phase station when no active executions exist', async () => {
      prismaMock.productionOrder.findMany.mockResolvedValue([
        {
          id: 'order-3',
          tenantId,
          number: '2026-0003',
          status: ProductionOrderStatus.PLANNED,
          plannedEndAt: new Date('2026-05-28T10:45:00.000Z'),
          executions: [
            {
              workStationId: 'ws-completed',
              status: PhaseExecutionStatus.COMPLETED,
              phase: { order: 1 },
            },
          ],
          recipe: { phases: [{ workStationId: 'ws-recipe' }] },
        },
      ]);

      const rows = await repository.findDelayedOrdersForAlarmScan(tenantId, now);

      expect(rows[0]?.workStationId).toBe('ws-recipe');
    });
  });

  describe('findRecentDispatch', () => {
    it('scopes dedup lookup by tenant, alarmType, executionId, and since window', async () => {
      prismaMock.plantAlarmDispatch.findFirst.mockResolvedValue(null);

      await repository.findRecentDispatch(
        tenantId,
        {
          alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
          executionId: 'exec-1',
        },
        since,
      );

      expect(prismaMock.plantAlarmDispatch.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
          dispatchedAt: { gte: since },
          executionId: 'exec-1',
        },
        orderBy: { dispatchedAt: 'desc' },
      });
    });

    it('scopes OP_RETRASADA dedup by orderId with null executionId', async () => {
      prismaMock.plantAlarmDispatch.findFirst.mockResolvedValue(null);

      await repository.findRecentDispatch(
        tenantId,
        {
          alarmType: PlantAlarmType.OP_RETRASADA,
          orderId: 'order-1',
        },
        since,
      );

      expect(prismaMock.plantAlarmDispatch.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          alarmType: PlantAlarmType.OP_RETRASADA,
          dispatchedAt: { gte: since },
          orderId: 'order-1',
          executionId: null,
        },
        orderBy: { dispatchedAt: 'desc' },
      });
    });
  });

  describe('createDispatch', () => {
    it('persists alarm dispatch audit row', async () => {
      const created = { id: 'dispatch-1' };
      prismaMock.plantAlarmDispatch.create.mockResolvedValue(created);

      const result = await repository.createDispatch({
        tenantId,
        alarmType: PlantAlarmType.FASE_SIN_OPERARIO,
        severity: AlarmSeverity.CRITICAL,
        message: 'Fase en proceso sin operario activo',
        executionId: 'exec-1',
        orderId: 'order-1',
      });

      expect(prismaMock.plantAlarmDispatch.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          alarmType: PlantAlarmType.FASE_SIN_OPERARIO,
          severity: AlarmSeverity.CRITICAL,
          message: 'Fase en proceso sin operario activo',
          executionId: 'exec-1',
          orderId: 'order-1',
          metadata: undefined,
        },
      });
      expect(result).toBe(created);
    });
  });

  describe('markDispatchSent', () => {
    it('updates dispatch metadata with SENT notification status', async () => {
      prismaMock.plantAlarmDispatch.findFirst.mockResolvedValue({
        id: 'dispatch-1',
        metadata: { source: 'cron' },
      });
      prismaMock.plantAlarmDispatch.update.mockResolvedValue({ id: 'dispatch-1' });

      await repository.markDispatchSent(tenantId, 'dispatch-1');

      expect(prismaMock.plantAlarmDispatch.findFirst).toHaveBeenCalledWith({
        where: { id: 'dispatch-1', tenantId },
      });
      expect(prismaMock.plantAlarmDispatch.update).toHaveBeenCalledWith({
        where: { id: 'dispatch-1' },
        data: {
          metadata: expect.objectContaining({
            source: 'cron',
            notificationStatus: PLANT_ALARM_NOTIFICATION_STATUS.SENT,
            notificationSentAt: expect.any(String),
            notificationError: null,
          }),
        },
      });
    });
  });

  describe('markDispatchFailed', () => {
    it('updates dispatch metadata with FAILED notification status and error', async () => {
      prismaMock.plantAlarmDispatch.findFirst.mockResolvedValue({
        id: 'dispatch-2',
        metadata: null,
      });
      prismaMock.plantAlarmDispatch.update.mockResolvedValue({ id: 'dispatch-2' });

      await repository.markDispatchFailed(tenantId, 'dispatch-2', 'push failed');

      expect(prismaMock.plantAlarmDispatch.update).toHaveBeenCalledWith({
        where: { id: 'dispatch-2' },
        data: {
          metadata: expect.objectContaining({
            notificationStatus: PLANT_ALARM_NOTIFICATION_STATUS.FAILED,
            notificationFailedAt: expect.any(String),
            notificationError: 'push failed',
          }),
        },
      });
    });

    it('returns null when dispatch is not found for tenant', async () => {
      prismaMock.plantAlarmDispatch.findFirst.mockResolvedValue(null);

      const result = await repository.markDispatchFailed(tenantId, 'missing', 'push failed');

      expect(result).toBeNull();
      expect(prismaMock.plantAlarmDispatch.update).not.toHaveBeenCalled();
    });
  });
});
