import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';

import { VacationAccrualService } from '../service/vacation-accrual.service';
import {
  VACATION_ACCRUAL_QUEUE_NAME,
  type VacationAccrualJobPayload,
} from './vacation-accrual.scheduler';

@Injectable()
export class VacationAccrualProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VacationAccrualProcessor.name);
  private worker?: Worker<VacationAccrualJobPayload>;

  constructor(private readonly vacationAccrualService: VacationAccrualService) {}

  onModuleInit(): void {
    if (process.env.VACATION_ACCRUAL_WORKER_ENABLED === 'false') {
      this.logger.log('Vacation accrual worker disabled (VACATION_ACCRUAL_WORKER_ENABLED=false)');
      return;
    }

    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

    this.worker = new Worker<VacationAccrualJobPayload>(
      VACATION_ACCRUAL_QUEUE_NAME,
      async (job) => {
        await this.vacationAccrualService.accrueForTenant(job.data.tenantId);
      },
      {
        connection: { url: redisUrl },
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Vacation accrual job failed (${job?.id ?? 'unknown'}): ${String(error)}`);
    });

    this.logger.log(`Vacation accrual worker started (queue: ${VACATION_ACCRUAL_QUEUE_NAME})`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
