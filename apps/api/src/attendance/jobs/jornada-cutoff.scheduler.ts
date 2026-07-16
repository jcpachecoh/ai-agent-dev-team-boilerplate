import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../../prisma/prisma.service';
import { JornadaCutoffService } from '../service/jornada-cutoff.service';

@Injectable()
export class JornadaCutoffScheduler {
  private readonly logger = new Logger(JornadaCutoffScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jornadaCutoffService: JornadaCutoffService,
  ) {}

  @Cron('* * * * *', { timeZone: 'America/Bogota' })
  async handleCron(): Promise<void> {
    if (process.env.JORNADA_CUTOFF_SCHEDULER_ENABLED === 'false') {
      return;
    }

    const asOf = new Date();
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });

    let totalProcessed = 0;
    for (const tenant of tenants) {
      try {
        const processed = await this.jornadaCutoffService.runDueCutoffsForTenant(tenant.id, asOf);
        totalProcessed += processed;
      } catch (error: unknown) {
        this.logger.warn(`Jornada cutoff batch failed tenant=${tenant.id}: ${String(error)}`);
      }
    }

    if (totalProcessed > 0) {
      this.logger.log(
        JSON.stringify({
          event: 'jornada_cutoff_batch_completed',
          processed: totalProcessed,
          tenants: tenants.length,
        }),
      );
    }
  }
}
