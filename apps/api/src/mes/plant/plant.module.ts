import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { RecipeCategoriesModule } from '../../recipe-categories/recipe-categories.module';
import { SupplyItemsModule } from '../../supplyitems/supplyitems.module';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../../audit/audit.module';
import { MesAuthModule } from '../auth/mes-auth.module';
import { PlantAuthGuard } from './guards/plant-auth.guard';
import { PlantRolesGuard } from './guards/plant-roles.guard';
import {
  ALARM_PUSH_ADAPTER,
  EMERGENCY_ALERT_ADAPTER,
  PLANT_ALARM_EVENTS,
  type IPlantAlarmEvents,
} from './adapters/alarm-push.adapter.interface';
import { StubEmergencyAlertAdapter } from './adapters/stub-emergency.adapter';
import { StubOneSignalAdapter } from './adapters/stub-onesignal.adapter';
import { PlantController } from './controller/plant.controller';
import { PlantGateway } from './gateway/plant.gateway';
import { AlarmRepository } from './repository/alarm.repository';
import { IncidentRepository } from './repository/incident.repository';
import { CommitteeRepository } from './repository/committee.repository';
import { PlantRepository } from './repository/plant.repository';
import { ProductionLogRepository } from './repository/production-log.repository';
import { SupervisorRepository } from './repository/supervisor.repository';
import { AlarmEvaluatorService } from './service/alarm-evaluator.service';
import { AlarmNotificationService } from './service/alarm-notification.service';
import {
  AlarmService,
  PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME,
  PLANT_ALARM_QUEUE,
} from './service/alarm.service';
import { IncidentService } from './service/incident.service';
import { OperatorOrderRuntimeService } from './service/operator-order-runtime.service';
import { PhaseChainService } from './service/phase-chain.service';
import { PlantEventsService } from './service/plant-events.service';
import { CommitteeService } from './service/committee.service';
import { PlantService } from './service/plant.service';
import { ProductionOrderPdfService } from './service/production-order-pdf.service';
import { SupervisorService } from './service/supervisor.service';
import { AlarmNotificationWorker } from './worker/alarm-notification.worker';

function createPlantAlarmEventsPort(plantEventsService: PlantEventsService): IPlantAlarmEvents {
  return {
    emitAlarmTriggered(tenantId, payload) {
      plantEventsService.emitAlarmTriggered(tenantId, payload);
    },
  };
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RecipeCategoriesModule,
    SupplyItemsModule,
    AuthModule,
    AuditModule,
    MesAuthModule,
    JwtModule.register({
      secret:
        process.env.MES_JWT_SECRET ??
        process.env.JWT_SECRET ??
        'mes-dev-secret-change-in-production',
    }),
  ],
  controllers: [PlantController],
  providers: [
    PlantRepository,
    ProductionLogRepository,
    SupervisorRepository,
    CommitteeRepository,
    AlarmRepository,
    IncidentRepository,
    CommitteeService,
    PlantService,
    OperatorOrderRuntimeService,
    SupervisorService,
    ProductionOrderPdfService,
    IncidentService,
    AlarmEvaluatorService,
    AlarmService,
    AlarmNotificationService,
    AlarmNotificationWorker,
    PhaseChainService,
    PlantEventsService,
    PlantGateway,
    PlantAuthGuard,
    PlantRolesGuard,
    {
      provide: PLANT_ALARM_QUEUE,
      useFactory: () =>
        new Queue(PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME, {
          connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
        }),
    },
    {
      provide: PLANT_ALARM_EVENTS,
      useFactory: (plantEventsService: PlantEventsService) =>
        createPlantAlarmEventsPort(plantEventsService),
      inject: [PlantEventsService],
    },
    {
      provide: ALARM_PUSH_ADAPTER,
      useClass: StubOneSignalAdapter,
    },
    {
      provide: EMERGENCY_ALERT_ADAPTER,
      useClass: StubEmergencyAlertAdapter,
    },
  ],
})
export class PlantModule {}
