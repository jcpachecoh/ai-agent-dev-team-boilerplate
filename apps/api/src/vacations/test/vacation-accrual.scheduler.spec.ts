import { Test, TestingModule } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service';
import {
  VACATION_ACCRUAL_QUEUE,
  VacationAccrualScheduler,
} from '../jobs/vacation-accrual.scheduler';

describe('VacationAccrualScheduler', () => {
  let scheduler: VacationAccrualScheduler;
  let queue: jest.Mocked<Pick<Queue, 'add'>>;
  let prisma: { tenant: { findMany: jest.Mock } };
  const originalSchedulerEnabled = process.env.VACATION_ACCRUAL_SCHEDULER_ENABLED;

  beforeEach(async () => {
    queue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      tenant: {
        findMany: jest.fn().mockResolvedValue([{ id: 'tenant-1' }, { id: 'tenant-2' }]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacationAccrualScheduler,
        { provide: VACATION_ACCRUAL_QUEUE, useValue: queue },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    scheduler = module.get(VacationAccrualScheduler);
    delete process.env.VACATION_ACCRUAL_SCHEDULER_ENABLED;
  });

  afterEach(() => {
    if (originalSchedulerEnabled === undefined) {
      delete process.env.VACATION_ACCRUAL_SCHEDULER_ENABLED;
    } else {
      process.env.VACATION_ACCRUAL_SCHEDULER_ENABLED = originalSchedulerEnabled;
    }
  });

  it('does not enqueue jobs when VACATION_ACCRUAL_SCHEDULER_ENABLED=false', async () => {
    process.env.VACATION_ACCRUAL_SCHEDULER_ENABLED = 'false';

    await scheduler.scheduleMonthlyAccrual();

    expect(prisma.tenant.findMany).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('enqueues one accrual job per active tenant', async () => {
    const logSpy = jest.spyOn(scheduler['logger'], 'log').mockImplementation(() => undefined);

    await scheduler.scheduleMonthlyAccrual();

    expect(prisma.tenant.findMany).toHaveBeenCalledWith({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(queue.add).toHaveBeenCalledWith(
      'vacation-accrual-tenant-1',
      { tenantId: 'tenant-1' },
      expect.objectContaining({
        removeOnComplete: true,
        removeOnFail: false,
        jobId: expect.stringMatching(/^vacation-accrual-tenant-1-\d{4}-\d{2}$/),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"vacation_accrual_scheduled"'),
    );

    logSpy.mockRestore();
  });
});
