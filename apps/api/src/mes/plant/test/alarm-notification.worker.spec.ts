import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, PlantAlarmType } from '@prisma/client';
import type { PlantAlarmNotificationJob } from '../interfaces/alarm.interfaces';
import { PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME } from '../service/alarm.service';
import { AlarmNotificationService } from '../service/alarm-notification.service';
import { AlarmNotificationWorker } from '../worker/alarm-notification.worker';

const jobData: PlantAlarmNotificationJob = {
  tenantId: 'palos-de-lena',
  alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
  severity: AlarmSeverity.WARNING,
  message: 'Fase excedió tiempo estándar',
  stationId: 'ws-1',
  dispatchId: 'dispatch-1',
  orderId: 'order-1',
  executionId: 'exec-1',
};

const workerCloseMock = jest.fn().mockResolvedValue(undefined);
const workerOnMock = jest.fn();
let capturedProcessor: ((job: { data: PlantAlarmNotificationJob }) => Promise<void>) | undefined;
let capturedFailedHandler: ((job: { id?: string } | undefined, error: Error) => void) | undefined;

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((_queueName, processor) => {
    capturedProcessor = processor;
    return {
      close: workerCloseMock,
      on: workerOnMock.mockImplementation((event, handler) => {
        if (event === 'failed') {
          capturedFailedHandler = handler;
        }
      }),
    };
  }),
}));

describe('AlarmNotificationWorker', () => {
  let worker: AlarmNotificationWorker;
  const alarmNotificationServiceMock = {
    processNotification: jest.fn().mockResolvedValue(undefined),
  };
  const originalWorkerEnabled = process.env.PLANT_ALARM_WORKER_ENABLED;
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(async () => {
    capturedProcessor = undefined;
    capturedFailedHandler = undefined;
    workerCloseMock.mockClear();
    workerOnMock.mockClear();
    alarmNotificationServiceMock.processNotification.mockClear();
    delete process.env.PLANT_ALARM_WORKER_ENABLED;
    process.env.REDIS_URL = 'redis://test:6379';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlarmNotificationWorker,
        { provide: AlarmNotificationService, useValue: alarmNotificationServiceMock },
      ],
    }).compile();

    worker = module.get<AlarmNotificationWorker>(AlarmNotificationWorker);
  });

  afterEach(async () => {
    await worker.onModuleDestroy();
    if (originalWorkerEnabled === undefined) {
      delete process.env.PLANT_ALARM_WORKER_ENABLED;
    } else {
      process.env.PLANT_ALARM_WORKER_ENABLED = originalWorkerEnabled;
    }
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('does not start BullMQ worker when PLANT_ALARM_WORKER_ENABLED=false', () => {
    process.env.PLANT_ALARM_WORKER_ENABLED = 'false';

    worker.onModuleInit();

    expect(capturedProcessor).toBeUndefined();
    expect(workerOnMock).not.toHaveBeenCalled();
  });

  it('starts worker and delegates job processing to AlarmNotificationService', async () => {
    worker.onModuleInit();

    expect(capturedProcessor).toBeDefined();
    await capturedProcessor?.({ data: jobData });

    expect(alarmNotificationServiceMock.processNotification).toHaveBeenCalledWith(jobData);
    expect(workerOnMock).toHaveBeenCalledWith('failed', expect.any(Function));
  });

  it('registers failed handler that logs job failure context', () => {
    const errorSpy = jest.spyOn(worker['logger'], 'error').mockImplementation(() => undefined);

    worker.onModuleInit();
    capturedFailedHandler?.({ id: 'job-1' }, new Error('processing failed'));

    expect(errorSpy).toHaveBeenCalledWith(
      'Alarm notification job failed (job-1): Error: processing failed',
    );

    errorSpy.mockRestore();
  });

  it('registers failed handler with unknown job id when job is undefined', () => {
    const errorSpy = jest.spyOn(worker['logger'], 'error').mockImplementation(() => undefined);

    worker.onModuleInit();
    capturedFailedHandler?.(undefined, new Error('processing failed'));

    expect(errorSpy).toHaveBeenCalledWith(
      'Alarm notification job failed (unknown): Error: processing failed',
    );

    errorSpy.mockRestore();
  });

  it('does not close worker when worker was never started', async () => {
    process.env.PLANT_ALARM_WORKER_ENABLED = 'false';
    worker.onModuleInit();

    await worker.onModuleDestroy();

    expect(workerCloseMock).not.toHaveBeenCalled();
  });

  it('closes BullMQ worker on module destroy', async () => {
    worker.onModuleInit();

    await worker.onModuleDestroy();

    expect(workerCloseMock).toHaveBeenCalledTimes(1);
  });

  it('uses plant alarm notifications queue name when starting worker', () => {
    const { Worker } = jest.requireMock('bullmq') as { Worker: jest.Mock };

    worker.onModuleInit();

    expect(Worker).toHaveBeenCalledWith(
      PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME,
      expect.any(Function),
      expect.objectContaining({
        connection: { url: 'redis://test:6379' },
      }),
    );
  });
});
