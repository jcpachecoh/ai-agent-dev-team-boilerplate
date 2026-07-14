import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { Queue } from 'bullmq';

import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { VacationAccrualProcessor } from './jobs/vacation-accrual.processor';
import {
  VACATION_ACCRUAL_QUEUE,
  VACATION_ACCRUAL_QUEUE_NAME,
} from './jobs/vacation-accrual.scheduler';
import { VacationAccrualScheduler } from './jobs/vacation-accrual.scheduler';
import { VacationsRepository } from './repository/vacations.repository';
import { VacationAccrualService } from './service/vacation-accrual.service';
import { VacationLetterService } from './service/vacation-letter.service';
import { VacationsService } from './service/vacations.service';
import { VACATION_LETTER_SERVICE } from './interfaces/vacations.interfaces';
import { VacationsController } from './controller/vacations.controller';
import { VacationsResolver } from './resolver/vacations.resolver';

@Module({
  imports: [PrismaModule, LocationsModule, StorageModule, ScheduleModule.forRoot(), AuthModule],
  controllers: [VacationsController],
  providers: [
    VacationsRepository,
    VacationAccrualService,
    VacationsService,
    VacationLetterService,
    VacationsResolver,
    {
      provide: VACATION_LETTER_SERVICE,
      useExisting: VacationLetterService,
    },
    VacationAccrualProcessor,
    VacationAccrualScheduler,
    {
      provide: VACATION_ACCRUAL_QUEUE,
      useFactory: () =>
        new Queue(VACATION_ACCRUAL_QUEUE_NAME, {
          connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
        }),
    },
  ],
  exports: [VacationsRepository, VacationAccrualService, VacationsService, VacationLetterService],
})
export class VacationsModule {}
