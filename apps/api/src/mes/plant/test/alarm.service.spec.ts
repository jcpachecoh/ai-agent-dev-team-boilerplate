import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, PlantAlarmType } from '@prisma/client';
import type { AlarmCandidate } from '../interfaces/alarm.interfaces';
import { AlarmRepository } from '../repository/alarm.repository';
import { ALARM_DEDUP_WINDOW_MS, AlarmService, PLANT_ALARM_QUEUE } from '../service/alarm.service';
import { AlarmEvaluatorService } from '../service/alarm-evaluator.service';

const tenantId = 'palos-de-lena';
const now = new Date('2026-05-28T10:30:00.000Z');

const alarmRepositoryMock = {
  findActiveAlarmTenantIds: jest.fn(),
  findActiveExecutionsForAlarmScan: jest.fn(),
  findDelayedOrdersForAlarmScan: jest.fn(),
  findRecentDispatch: jest.fn(),
  createDispatch: jest.fn(),
};

const alarmEvaluatorMock = {
  evaluateTenantAlarms: jest.fn(),
};

const alarmQueueMock = {
  add: jest.fn(),
};

const candidate: AlarmCandidate = {
  alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
  severity: AlarmSeverity.WARNING,
  tenantId,
  workStationId: 'ws-1',
  executionId: 'exec-1',
  orderId: 'order-1',
  message: 'Fase excedió tiempo estándar',
};

describe('AlarmService', () => {
  let service: AlarmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlarmService,
        { provide: AlarmRepository, useValue: alarmRepositoryMock },
        { provide: AlarmEvaluatorService, useValue: alarmEvaluatorMock },
        { provide: PLANT_ALARM_QUEUE, useValue: alarmQueueMock },
      ],
    }).compile();

    service = module.get<AlarmService>(AlarmService);
    jest.clearAllMocks();
  });

  describe('handleAlarmEvaluationCron', () => {
    it('evaluates each active tenant independently', async () => {
      alarmRepositoryMock.findActiveAlarmTenantIds.mockResolvedValue(['tenant-a', 'tenant-b']);
      const evaluateTenantSpy = jest.spyOn(service, 'evaluateTenant').mockResolvedValue(0);

      await service.handleAlarmEvaluationCron();

      expect(alarmRepositoryMock.findActiveAlarmTenantIds).toHaveBeenCalledWith(expect.any(Date));
      expect(evaluateTenantSpy).toHaveBeenCalledTimes(2);
      expect(evaluateTenantSpy).toHaveBeenCalledWith('tenant-a', expect.any(Date));
      expect(evaluateTenantSpy).toHaveBeenCalledWith('tenant-b', expect.any(Date));
    });

    it('continues evaluating other tenants when one tenant fails', async () => {
      alarmRepositoryMock.findActiveAlarmTenantIds.mockResolvedValue(['tenant-a', 'tenant-b']);
      jest
        .spyOn(service, 'evaluateTenant')
        .mockRejectedValueOnce(new Error('tenant-a failed'))
        .mockResolvedValueOnce(1);

      await expect(service.handleAlarmEvaluationCron()).resolves.toBeUndefined();

      expect(service.evaluateTenant).toHaveBeenCalledTimes(2);
    });
  });

  describe('evaluateTenant', () => {
    beforeEach(() => {
      alarmRepositoryMock.findActiveExecutionsForAlarmScan.mockResolvedValue([]);
      alarmRepositoryMock.findDelayedOrdersForAlarmScan.mockResolvedValue([]);
      alarmEvaluatorMock.evaluateTenantAlarms.mockReturnValue([]);
    });

    it('loads scan rows, evaluates candidates, and enqueues after dedup passes', async () => {
      alarmEvaluatorMock.evaluateTenantAlarms.mockReturnValue([candidate]);
      alarmRepositoryMock.findRecentDispatch.mockResolvedValue(null);
      alarmRepositoryMock.createDispatch.mockResolvedValue({ id: 'dispatch-1' });
      alarmQueueMock.add.mockResolvedValue({ id: 'job-1' });

      const enqueued = await service.evaluateTenant(tenantId, now);

      expect(alarmRepositoryMock.findActiveExecutionsForAlarmScan).toHaveBeenCalledWith(tenantId);
      expect(alarmRepositoryMock.findDelayedOrdersForAlarmScan).toHaveBeenCalledWith(tenantId, now);
      expect(alarmRepositoryMock.findRecentDispatch).toHaveBeenCalledWith(
        tenantId,
        {
          alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
          executionId: 'exec-1',
          orderId: 'order-1',
        },
        new Date(now.getTime() - ALARM_DEDUP_WINDOW_MS),
      );
      expect(alarmRepositoryMock.createDispatch).toHaveBeenCalledWith({
        tenantId,
        alarmType: candidate.alarmType,
        severity: candidate.severity,
        message: candidate.message,
        executionId: 'exec-1',
        orderId: 'order-1',
      });
      expect(alarmQueueMock.add).toHaveBeenCalledWith(
        'alarm-dispatch-1',
        {
          tenantId,
          alarmType: candidate.alarmType,
          severity: candidate.severity,
          message: candidate.message,
          stationId: candidate.workStationId,
          dispatchId: 'dispatch-1',
          orderId: candidate.orderId,
          executionId: candidate.executionId,
        },
        expect.objectContaining({ attempts: 3 }),
      );
      expect(enqueued).toBe(1);
    });

    it('skips enqueue when a recent dispatch exists within the dedup window', async () => {
      alarmEvaluatorMock.evaluateTenantAlarms.mockReturnValue([candidate]);
      alarmRepositoryMock.findRecentDispatch.mockResolvedValue({ id: 'recent-dispatch' });

      const enqueued = await service.evaluateTenant(tenantId, now);

      expect(alarmRepositoryMock.createDispatch).not.toHaveBeenCalled();
      expect(alarmQueueMock.add).not.toHaveBeenCalled();
      expect(enqueued).toBe(0);
    });

    it('enqueues again when no dispatch exists within the dedup window', async () => {
      alarmEvaluatorMock.evaluateTenantAlarms.mockReturnValue([candidate]);
      alarmRepositoryMock.findRecentDispatch.mockResolvedValue(null);
      alarmRepositoryMock.createDispatch.mockResolvedValue({ id: 'dispatch-after-window' });
      alarmQueueMock.add.mockResolvedValue({ id: 'job-after-window' });

      const enqueued = await service.evaluateTenant(tenantId, now);

      expect(alarmRepositoryMock.findRecentDispatch).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
          executionId: 'exec-1',
        }),
        new Date(now.getTime() - ALARM_DEDUP_WINDOW_MS),
      );
      expect(alarmQueueMock.add).toHaveBeenCalledTimes(1);
      expect(enqueued).toBe(1);
    });

    it('does not invoke push adapters or websocket emitters during cron evaluation', async () => {
      alarmEvaluatorMock.evaluateTenantAlarms.mockReturnValue([candidate]);
      alarmRepositoryMock.findRecentDispatch.mockResolvedValue(null);
      alarmRepositoryMock.createDispatch.mockResolvedValue({ id: 'dispatch-1' });

      await service.evaluateTenant(tenantId, now);

      expect(alarmRepositoryMock.findActiveExecutionsForAlarmScan).toHaveBeenCalled();
      expect(alarmEvaluatorMock.evaluateTenantAlarms).toHaveBeenCalled();
      expect(alarmQueueMock.add).toHaveBeenCalledTimes(1);
    });

    it('uses order-based dedup key for OP_RETRASADA candidates', async () => {
      const delayedOrderCandidate: AlarmCandidate = {
        alarmType: PlantAlarmType.OP_RETRASADA,
        severity: AlarmSeverity.WARNING,
        tenantId,
        workStationId: 'ws-2',
        orderId: 'order-2',
        message: 'Orden 2026-0002 próxima a vencer',
      };
      alarmEvaluatorMock.evaluateTenantAlarms.mockReturnValue([delayedOrderCandidate]);
      alarmRepositoryMock.findRecentDispatch.mockResolvedValue(null);
      alarmRepositoryMock.createDispatch.mockResolvedValue({ id: 'dispatch-2' });

      await service.evaluateTenant(tenantId, now);

      expect(alarmRepositoryMock.findRecentDispatch).toHaveBeenCalledWith(
        tenantId,
        {
          alarmType: PlantAlarmType.OP_RETRASADA,
          orderId: 'order-2',
          executionId: null,
        },
        expect.any(Date),
      );
    });
  });
});
