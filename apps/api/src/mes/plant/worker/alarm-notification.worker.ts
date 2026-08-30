import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { PlantAlarmNotificationJob } from '../interfaces/alarm.interfaces';
import { PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME } from '../service/alarm.service';
import { AlarmNotificationService } from '../service/alarm-notification.service';

@Injectable()
export class AlarmNotificationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlarmNotificationWorker.name);
  private worker?: Worker<PlantAlarmNotificationJob>;

  constructor(private readonly alarmNotificationService: AlarmNotificationService) {}

  onModuleInit(): void {
    if (process.env.PLANT_ALARM_WORKER_ENABLED === 'false') {
      this.logger.log(
        'Plant alarm notification worker disabled (PLANT_ALARM_WORKER_ENABLED=false)',
      );
      return;
    }

    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

    this.worker = new Worker<PlantAlarmNotificationJob>(
      PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME,
      async (job) => {
        await this.alarmNotificationService.processNotification(job.data);
      },
      {
        connection: { url: redisUrl },
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Alarm notification job failed (${job?.id ?? 'unknown'}): ${String(error)}`,
      );
    });

    this.logger.log(
      `Plant alarm notification worker started (queue: ${PLANT_ALARM_NOTIFICATIONS_QUEUE_NAME})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
