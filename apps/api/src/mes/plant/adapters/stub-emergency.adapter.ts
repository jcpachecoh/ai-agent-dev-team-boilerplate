import { Injectable, Logger } from '@nestjs/common';
import type { EmergencyAlertParams, IEmergencyAlertAdapter } from '../interfaces/alarm.interfaces';

/**
 * Stub emergency adapter (D8). Uses optional PLANT_EMERGENCY_WEBHOOK_URL env var.
 * Tenant-specific webhook mapping is deferred — single env var for MES-08.
 */
@Injectable()
export class StubEmergencyAlertAdapter implements IEmergencyAlertAdapter {
  private readonly logger = new Logger(StubEmergencyAlertAdapter.name);
  private readonly webhookUrl = process.env.PLANT_EMERGENCY_WEBHOOK_URL;

  async notify(params: EmergencyAlertParams): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.debug('PLANT_EMERGENCY_WEBHOOK_URL unset — skipping emergency alert');
      return;
    }

    const body = JSON.stringify({
      tenantId: params.tenantId,
      alarmType: params.alarmType,
      severity: params.severity,
      stationId: params.stationId,
      orderId: params.orderId,
      executionId: params.executionId,
      message: params.message,
    });

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      throw new Error(`Emergency webhook failed (${response.status}): ${response.statusText}`);
    }

    this.logger.log(
      JSON.stringify({
        adapter: 'stub-emergency',
        tenantId: params.tenantId,
        stationId: params.stationId,
        severity: params.severity,
      }),
    );
  }
}
