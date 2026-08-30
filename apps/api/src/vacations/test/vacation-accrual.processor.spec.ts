import { Test, TestingModule } from '@nestjs/testing';

import { VacationAccrualProcessor } from '../jobs/vacation-accrual.processor';
import {
  VACATION_ACCRUAL_QUEUE_NAME,
  type VacationAccrualJobPayload,
} from '../jobs/vacation-accrual.scheduler';
import { VacationAccrualService } from '../service/vacation-accrual.service';

const jobData: VacationAccrualJobPayload = { tenantId: 'tenant-1' };

const workerCloseMock = jest.fn().mockResolvedValue(undefined);
const workerOnMock = jest.fn();
let capturedProcessor: ((job: { data: VacationAccrualJobPayload }) => Promise<void>) | undefined;
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

describe('VacationAccrualProcessor', () => {
  let processor: VacationAccrualProcessor;
  const vacationAccrualServiceMock = {
    accrueForTenant: jest.fn().mockResolvedValue(undefined),
  };
  const originalWorkerEnabled = process.env.VACATION_ACCRUAL_WORKER_ENABLED;
  const originalRedisUrl = process.env.REDIS_URL;

  beforeEach(async () => {
    capturedProcessor = undefined;
    capturedFailedHandler = undefined;
    workerCloseMock.mockClear();
    workerOnMock.mockClear();
    vacationAccrualServiceMock.accrueForTenant.mockClear();
    delete process.env.VACATION_ACCRUAL_WORKER_ENABLED;
    process.env.REDIS_URL = 'redis://test:6379';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacationAccrualProcessor,
        { provide: VacationAccrualService, useValue: vacationAccrualServiceMock },
      ],
    }).compile();

    processor = module.get(VacationAccrualProcessor);
  });

  afterEach(async () => {
    await processor.onModuleDestroy();
    if (originalWorkerEnabled === undefined) {
      delete process.env.VACATION_ACCRUAL_WORKER_ENABLED;
    } else {
      process.env.VACATION_ACCRUAL_WORKER_ENABLED = originalWorkerEnabled;
    }
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('does not start BullMQ worker when VACATION_ACCRUAL_WORKER_ENABLED=false', () => {
    process.env.VACATION_ACCRUAL_WORKER_ENABLED = 'false';

    processor.onModuleInit();

    expect(capturedProcessor).toBeUndefined();
    expect(workerOnMock).not.toHaveBeenCalled();
  });

  it('starts worker and delegates job processing to VacationAccrualService', async () => {
    processor.onModuleInit();

    expect(capturedProcessor).toBeDefined();
    await capturedProcessor?.({ data: jobData });

    expect(vacationAccrualServiceMock.accrueForTenant).toHaveBeenCalledWith('tenant-1');
    expect(workerOnMock).toHaveBeenCalledWith('failed', expect.any(Function));
  });

  it('registers failed handler that logs job failure context', () => {
    const errorSpy = jest.spyOn(processor['logger'], 'error').mockImplementation(() => undefined);

    processor.onModuleInit();
    capturedFailedHandler?.({ id: 'job-1' }, new Error('processing failed'));

    expect(errorSpy).toHaveBeenCalledWith(
      'Vacation accrual job failed (job-1): Error: processing failed',
    );

    errorSpy.mockRestore();
  });

  it('registers failed handler with unknown job id when job is undefined', () => {
    const errorSpy = jest.spyOn(processor['logger'], 'error').mockImplementation(() => undefined);

    processor.onModuleInit();
    capturedFailedHandler?.(undefined, new Error('processing failed'));

    expect(errorSpy).toHaveBeenCalledWith(
      'Vacation accrual job failed (unknown): Error: processing failed',
    );

    errorSpy.mockRestore();
  });

  it('does not close worker when worker was never started', async () => {
    process.env.VACATION_ACCRUAL_WORKER_ENABLED = 'false';
    processor.onModuleInit();

    await processor.onModuleDestroy();

    expect(workerCloseMock).not.toHaveBeenCalled();
  });

  it('closes BullMQ worker on module destroy', async () => {
    processor.onModuleInit();

    await processor.onModuleDestroy();

    expect(workerCloseMock).toHaveBeenCalledTimes(1);
  });

  it('uses vacation accrual queue name when starting worker', () => {
    const { Worker } = jest.requireMock('bullmq') as { Worker: jest.Mock };

    processor.onModuleInit();

    expect(Worker).toHaveBeenCalledWith(
      VACATION_ACCRUAL_QUEUE_NAME,
      expect.any(Function),
      expect.objectContaining({
        connection: { url: 'redis://test:6379' },
      }),
    );
  });

  it('falls back to localhost redis when REDIS_URL is unset', () => {
    const { Worker } = jest.requireMock('bullmq') as { Worker: jest.Mock };
    delete process.env.REDIS_URL;

    processor.onModuleInit();

    expect(Worker).toHaveBeenCalledWith(
      VACATION_ACCRUAL_QUEUE_NAME,
      expect.any(Function),
      expect.objectContaining({
        connection: { url: 'redis://localhost:6379' },
      }),
    );
  });
});
