import { Injectable, Logger } from '@nestjs/common';
import type { AlarmPushParams, IAlarmPushAdapter } from '../interfaces/alarm.interfaces';

/**
 * Stub push adapter (D8). Logs structured payload — no network.
 * Future real impl may read ONESIGNAL_APP_ID / ONESIGNAL_API_KEY.
 */
@Injectable()
export class StubOneSignalAdapter implements IAlarmPushAdapter {
  private readonly logger = new Logger(StubOneSignalAdapter.name);

  async send(params: AlarmPushParams): Promise<void> {
    this.logger.log(
      JSON.stringify({
        adapter: 'stub-onesignal',
        tenantId: params.tenantId,
        alarmType: params.alarmType,
        severity: params.severity,
        stationId: params.stationId,
        orderId: params.orderId,
        executionId: params.executionId,
        message: params.message,
      }),
    );
  }
}
