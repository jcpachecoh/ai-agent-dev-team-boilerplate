import { AlarmSeverity, PlantAlarmType } from '@prisma/client';
import { StubOneSignalAdapter } from '../adapters/stub-onesignal.adapter';

describe('StubOneSignalAdapter', () => {
  it('logs structured payload without performing network calls', async () => {
    const adapter = new StubOneSignalAdapter();
    const logSpy = jest.spyOn(adapter['logger'], 'log').mockImplementation(() => undefined);

    await adapter.send({
      tenantId: 'palos-de-lena',
      alarmType: PlantAlarmType.FASE_SIN_OPERARIO,
      severity: AlarmSeverity.CRITICAL,
      message: 'Fase en proceso sin operario activo',
      stationId: 'ws-1',
      orderId: 'order-1',
      executionId: 'exec-1',
    });

    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        adapter: 'stub-onesignal',
        tenantId: 'palos-de-lena',
        alarmType: PlantAlarmType.FASE_SIN_OPERARIO,
        severity: AlarmSeverity.CRITICAL,
        stationId: 'ws-1',
        orderId: 'order-1',
        executionId: 'exec-1',
        message: 'Fase en proceso sin operario activo',
      }),
    );

    logSpy.mockRestore();
  });
});
