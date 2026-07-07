import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PlantAlarmType } from '@prisma/client';
import type { Queue } from 'bullmq';
import type {
  AlarmCandidate,
  AlarmDedupKey,
  PlantAlarmNotificationJob,
} from '../interfaces/alarm.interfaces';
import { AlarmRepository } from '../repository/alarm.repository';
import { AlarmEvaluatorService } from './alarm-evaluator.service';

export const PLANT_ALARM_QUEUE = Symbol('PLANT_ALARM_QUEUE');
export const PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME = 'plant-alarm-notifications';

export const ALARM_CRON_INTERVAL_MS = 60_000;
export const ALARM_DEDUP_WINDOW_MS = 30 * 60_000;

export const PLANT_ALARM_JOB_OPTIONS = {
  removeOnComplete: 100,
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
};

@Injectable()
export class AlarmService {
  private readonly logger = new Logger(AlarmService.name);

  constructor(
    private readonly alarmRepository: AlarmRepository,
    private readonly alarmEvaluator: AlarmEvaluatorService,
    @Inject(PLANT_ALARM_QUEUE)
    private readonly alarmQueue: Queue<PlantAlarmNotificationJob>,
  ) {}

  @Interval(ALARM_CRON_INTERVAL_MS)
  async handleAlarmEvaluationCron(): Promise<void> {
    const now = new Date();
    const tenantIds = await this.alarmRepository.findActiveAlarmTenantIds(now);

    for (const tenantId of tenantIds) {
      try {
        await this.evaluateTenant(tenantId, now);
      } catch (error) {
        this.logger.error(`Alarm evaluation failed for tenant "${tenantId}": ${String(error)}`);
      }
    }
  }

  async evaluateTenant(tenantId: string, now: Date): Promise<number> {
    const [executions, orders] = await Promise.all([
      this.alarmRepository.findActiveExecutionsForAlarmScan(tenantId),
      this.alarmRepository.findDelayedOrdersForAlarmScan(tenantId, now),
    ]);

    const candidates = this.alarmEvaluator.evaluateTenantAlarms({ executions, orders }, now);
    const since = new Date(now.getTime() - ALARM_DEDUP_WINDOW_MS);
    let enqueued = 0;

    for (const candidate of candidates) {
      const dispatched = await this.dispatchCandidateIfAllowed(tenantId, candidate, since);
      if (dispatched) {
        enqueued += 1;
      }
    }

    return enqueued;
  }

  private async dispatchCandidateIfAllowed(
    tenantId: string,
    candidate: AlarmCandidate,
    since: Date,
  ): Promise<boolean> {
    const dedupKey = toDedupKey(candidate);
    const recent = await this.alarmRepository.findRecentDispatch(tenantId, dedupKey, since);
    if (recent) {
      return false;
    }

    const dispatch = await this.alarmRepository.createDispatch({
      tenantId,
      alarmType: candidate.alarmType,
      severity: candidate.severity,
      message: candidate.message,
      executionId: candidate.executionId ?? null,
      orderId: candidate.orderId ?? null,
    });

    const job: PlantAlarmNotificationJob = {
      tenantId,
      alarmType: candidate.alarmType,
      severity: candidate.severity,
      message: candidate.message,
      stationId: candidate.workStationId,
      dispatchId: dispatch.id,
      orderId: candidate.orderId,
      executionId: candidate.executionId,
    };

    await this.alarmQueue.add(`alarm-${dispatch.id}`, job, PLANT_ALARM_JOB_OPTIONS);
    return true;
  }
}

function toDedupKey(candidate: AlarmCandidate): AlarmDedupKey {
  if (candidate.alarmType === PlantAlarmType.OP_RETRASADA) {
    return {
      alarmType: candidate.alarmType,
      orderId: candidate.orderId,
      executionId: null,
    };
  }

  return {
    alarmType: candidate.alarmType,
    executionId: candidate.executionId,
    orderId: candidate.orderId ?? null,
  };
}
