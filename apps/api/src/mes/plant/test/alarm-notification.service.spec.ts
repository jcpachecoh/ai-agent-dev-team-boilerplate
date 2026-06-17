import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, PlantAlarmType } from '@prisma/client';
import {
  ALARM_PUSH_ADAPTER,
  EMERGENCY_ALERT_ADAPTER,
  PLANT_ALARM_EVENTS,
} from '../adapters/alarm-push.adapter.interface';
import type { PlantAlarmNotificationJob } from '../interfaces/alarm.interfaces';
import { AlarmRepository } from '../repository/alarm.repository';
import { AlarmNotificationService } from '../service/alarm-notification.service';

const job: PlantAlarmNotificationJob = {
  tenantId: 'palos-de-lena',
  alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
  severity: AlarmSeverity.WARNING,
  message: 'Fase excedió tiempo estándar',
  stationId: 'ws-1',
  dispatchId: 'dispatch-1',
  orderId: 'order-1',
  executionId: 'exec-1',
};

describe('AlarmNotificationService', () => {
  let service: AlarmNotificationService;
  const alarmRepositoryMock = {
    markDispatchSent: jest.fn().mockResolvedValue({ id: 'dispatch-1' }),
    markDispatchFailed: jest.fn().mockResolvedValue({ id: 'dispatch-1' }),
  };
  const plantAlarmEventsMock = { emitAlarmTriggered: jest.fn() };
  const pushAdapterMock = { send: jest.fn().mockResolvedValue(undefined) };
  const emergencyAdapterMock = { notify: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlarmNotificationService,
        { provide: AlarmRepository, useValue: alarmRepositoryMock },
        { provide: PLANT_ALARM_EVENTS, useValue: plantAlarmEventsMock },
        { provide: ALARM_PUSH_ADAPTER, useValue: pushAdapterMock },
        { provide: EMERGENCY_ALERT_ADAPTER, useValue: emergencyAdapterMock },
      ],
    }).compile();

    service = module.get<AlarmNotificationService>(AlarmNotificationService);
    jest.clearAllMocks();
    pushAdapterMock.send.mockResolvedValue(undefined);
    emergencyAdapterMock.notify.mockResolvedValue(undefined);
    alarmRepositoryMock.markDispatchSent.mockResolvedValue({ id: 'dispatch-1' });
    alarmRepositoryMock.markDispatchFailed.mockResolvedValue({ id: 'dispatch-1' });
  });

  it('emits alarm:triggered synchronously before push adapter on job process', async () => {
    const callOrder: string[] = [];
    plantAlarmEventsMock.emitAlarmTriggered.mockImplementation(() => {
      callOrder.push('ws');
    });
    pushAdapterMock.send.mockImplementation(async () => {
      callOrder.push('push');
    });

    await service.processNotification(job);

    expect(callOrder).toEqual(['ws', 'push']);
  });

  it('marks dispatch as SENT after successful notification', async () => {
    await service.processNotification(job);

    expect(plantAlarmEventsMock.emitAlarmTriggered).toHaveBeenCalledWith(job.tenantId, {
      alarmType: job.alarmType,
      severity: job.severity,
      stationId: job.stationId,
      orderId: job.orderId,
      executionId: job.executionId,
      message: job.message,
    });
    expect(pushAdapterMock.send).toHaveBeenCalledWith({
      tenantId: job.tenantId,
      alarmType: job.alarmType,
      severity: job.severity,
      message: job.message,
      stationId: job.stationId,
      orderId: job.orderId,
      executionId: job.executionId,
    });
    expect(emergencyAdapterMock.notify).not.toHaveBeenCalled();
    expect(alarmRepositoryMock.markDispatchSent).toHaveBeenCalledWith(job.tenantId, job.dispatchId);
    expect(alarmRepositoryMock.markDispatchFailed).not.toHaveBeenCalled();
  });

  it('invokes emergency adapter and marks SENT for CRITICAL severity', async () => {
    await service.processNotification({
      ...job,
      severity: AlarmSeverity.CRITICAL,
    });

    expect(emergencyAdapterMock.notify).toHaveBeenCalledWith({
      tenantId: job.tenantId,
      alarmType: job.alarmType,
      severity: AlarmSeverity.CRITICAL,
      message: job.message,
      stationId: job.stationId,
      orderId: job.orderId,
      executionId: job.executionId,
    });
    expect(alarmRepositoryMock.markDispatchSent).toHaveBeenCalledWith(job.tenantId, job.dispatchId);
    expect(alarmRepositoryMock.markDispatchFailed).not.toHaveBeenCalled();
  });

  it('marks dispatch as FAILED and rethrows when notification fails', async () => {
    pushAdapterMock.send.mockRejectedValue(new Error('push failed'));

    await expect(service.processNotification(job)).rejects.toThrow('push failed');

    expect(alarmRepositoryMock.markDispatchFailed).toHaveBeenCalledWith(
      job.tenantId,
      job.dispatchId,
      'push failed',
    );
    expect(alarmRepositoryMock.markDispatchSent).not.toHaveBeenCalled();
  });
});
