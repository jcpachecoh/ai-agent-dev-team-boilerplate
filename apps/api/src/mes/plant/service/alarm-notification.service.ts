import { Inject, Injectable } from '@nestjs/common';
import { AlarmSeverity } from '@prisma/client';
import type { AlarmTriggeredPayload } from '../controller/dto/alarm-triggered.payload';
import {
  ALARM_PUSH_ADAPTER,
  EMERGENCY_ALERT_ADAPTER,
  PLANT_ALARM_EVENTS,
  type IPlantAlarmEvents,
} from '../adapters/alarm-push.adapter.interface';
import type {
  IAlarmPushAdapter,
  IEmergencyAlertAdapter,
  PlantAlarmNotificationJob,
} from '../interfaces/alarm.interfaces';
import { AlarmRepository } from '../repository/alarm.repository';

@Injectable()
export class AlarmNotificationService {
  constructor(
    private readonly alarmRepository: AlarmRepository,
    @Inject(PLANT_ALARM_EVENTS)
    private readonly plantAlarmEvents: IPlantAlarmEvents,
    @Inject(ALARM_PUSH_ADAPTER)
    private readonly pushAdapter: IAlarmPushAdapter,
    @Inject(EMERGENCY_ALERT_ADAPTER)
    private readonly emergencyAdapter: IEmergencyAlertAdapter,
  ) {}

  async processNotification(job: PlantAlarmNotificationJob): Promise<void> {
    try {
      const payload = toAlarmTriggeredPayload(job);

      this.plantAlarmEvents.emitAlarmTriggered(job.tenantId, payload);

      await this.pushAdapter.send({
        tenantId: job.tenantId,
        alarmType: job.alarmType,
        severity: job.severity,
        message: job.message,
        stationId: job.stationId,
        orderId: job.orderId,
        executionId: job.executionId,
      });

      if (job.severity === AlarmSeverity.CRITICAL) {
        await this.emergencyAdapter.notify({
          tenantId: job.tenantId,
          alarmType: job.alarmType,
          severity: job.severity,
          message: job.message,
          stationId: job.stationId,
          orderId: job.orderId,
          executionId: job.executionId,
        });
      }

      await this.alarmRepository.markDispatchSent(job.tenantId, job.dispatchId);
    } catch (error) {
      await this.alarmRepository.markDispatchFailed(
        job.tenantId,
        job.dispatchId,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}

function toAlarmTriggeredPayload(job: PlantAlarmNotificationJob): AlarmTriggeredPayload {
  return {
    alarmType: job.alarmType,
    severity: job.severity,
    stationId: job.stationId,
    orderId: job.orderId,
    executionId: job.executionId,
    message: job.message,
  };
}
