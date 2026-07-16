import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DailyCostCenterController } from './controller/daily-cost-center.controller';
import { DailyCostCenterRepository } from './repository/daily-cost-center.repository';
import { DailyCostCenterService } from './service/daily-cost-center.service';
import { RotanteProrationService } from './service/rotante-proration.service';

/** CONN-06 — Prorrateo de costo por sede real para empleados ROTANTE. */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DailyCostCenterController],
  providers: [DailyCostCenterRepository, DailyCostCenterService, RotanteProrationService],
  exports: [DailyCostCenterRepository, DailyCostCenterService, RotanteProrationService],
})
export class DailyCostCenterModule {}
