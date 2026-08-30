import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Queue } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service';
import { formatYearMonth } from '../utils/vacation-accrual.utils';

export const VACATION_ACCRUAL_QUEUE_NAME = 'vacation-accrual';
export const VACATION_ACCRUAL_QUEUE = Symbol('VACATION_ACCRUAL_QUEUE');

export interface VacationAccrualJobPayload {
  tenantId: string;
}

/**
 * Encola la acumulación mensual el día 1 de cada mes a las 02:00 America/Bogota.
 * El worker (`VacationAccrualProcessor`) procesa un job por tenant.
 */
@Injectable()
export class VacationAccrualScheduler {
  private readonly logger = new Logger(VacationAccrualScheduler.name);

  constructor(
    @Inject(VACATION_ACCRUAL_QUEUE) private readonly queue: Queue<VacationAccrualJobPayload>,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('0 2 1 * *', { timeZone: 'America/Bogota' })
  async scheduleMonthlyAccrual(): Promise<void> {
    if (process.env.VACATION_ACCRUAL_SCHEDULER_ENABLED === 'false') {
      this.logger.log(
        'Vacation accrual scheduler disabled (VACATION_ACCRUAL_SCHEDULER_ENABLED=false)',
      );
      return;
    }

    const periodKey = formatYearMonth(new Date());
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.queue.add(
        `vacation-accrual-${tenant.id}`,
        { tenantId: tenant.id },
        {
          jobId: `vacation-accrual-${tenant.id}-${periodKey}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }

    this.logger.log(
      JSON.stringify({
        event: 'vacation_accrual_scheduled',
        periodKey,
        tenantsEnqueued: tenants.length,
      }),
    );
  }
}
