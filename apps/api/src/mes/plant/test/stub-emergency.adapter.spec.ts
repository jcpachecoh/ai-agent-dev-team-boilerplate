import { AlarmSeverity, PlantAlarmType } from '@prisma/client';
import { StubEmergencyAlertAdapter } from '../adapters/stub-emergency.adapter';

const params = {
  tenantId: 'palos-de-lena',
  alarmType: PlantAlarmType.FASE_SIN_OPERARIO,
  severity: AlarmSeverity.CRITICAL,
  message: 'Fase en proceso sin operario activo',
  stationId: 'ws-1',
  orderId: 'order-1',
  executionId: 'exec-1',
};

describe('StubEmergencyAlertAdapter', () => {
  const originalWebhookUrl = process.env.PLANT_EMERGENCY_WEBHOOK_URL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    if (originalWebhookUrl === undefined) {
      delete process.env.PLANT_EMERGENCY_WEBHOOK_URL;
    } else {
      process.env.PLANT_EMERGENCY_WEBHOOK_URL = originalWebhookUrl;
    }
  });

  it('skips emergency alert when webhook URL is not configured', async () => {
    delete process.env.PLANT_EMERGENCY_WEBHOOK_URL;
    const adapter = new StubEmergencyAlertAdapter();
    const debugSpy = jest.spyOn(adapter['logger'], 'debug').mockImplementation(() => undefined);

    await adapter.notify(params);

    expect(debugSpy).toHaveBeenCalledWith(
      'PLANT_EMERGENCY_WEBHOOK_URL unset — skipping emergency alert',
    );
    expect(fetchMock).not.toHaveBeenCalled();

    debugSpy.mockRestore();
  });

  it('posts to configured webhook URL with mocked fetch', async () => {
    process.env.PLANT_EMERGENCY_WEBHOOK_URL = 'https://example.test/emergency';
    fetchMock.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });

    const adapter = new StubEmergencyAlertAdapter();
    const logSpy = jest.spyOn(adapter['logger'], 'log').mockImplementation(() => undefined);

    await adapter.notify(params);

    expect(fetchMock).toHaveBeenCalledWith('https://example.test/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: params.tenantId,
        alarmType: params.alarmType,
        severity: params.severity,
        stationId: params.stationId,
        orderId: params.orderId,
        executionId: params.executionId,
        message: params.message,
      }),
    });
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        adapter: 'stub-emergency',
        tenantId: params.tenantId,
        stationId: params.stationId,
        severity: params.severity,
      }),
    );

    logSpy.mockRestore();
  });

  it('throws when mocked webhook responds with non-OK status', async () => {
    process.env.PLANT_EMERGENCY_WEBHOOK_URL = 'https://example.test/emergency';
    fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' });

    const adapter = new StubEmergencyAlertAdapter();

    await expect(adapter.notify(params)).rejects.toThrow(
      'Emergency webhook failed (503): Service Unavailable',
    );
  });
});
