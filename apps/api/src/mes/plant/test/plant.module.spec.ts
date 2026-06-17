import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, PlantAlarmType } from '@prisma/client';
import {
  PLANT_ALARM_EVENTS,
  type IPlantAlarmEvents,
} from '../adapters/alarm-push.adapter.interface';
import { PlantGateway } from '../gateway/plant.gateway';
import { PlantEventsService } from '../service/plant-events.service';

describe('PlantModule PLANT_ALARM_EVENTS wiring', () => {
  let alarmEvents: IPlantAlarmEvents;
  const gatewayMock = {
    emitAlarmTriggered: jest.fn(),
    emitPhaseStatusChanged: jest.fn(),
    emitIncidentCreated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantEventsService,
        { provide: PlantGateway, useValue: gatewayMock },
        {
          provide: PLANT_ALARM_EVENTS,
          useFactory: (plantEventsService: PlantEventsService): IPlantAlarmEvents => ({
            emitAlarmTriggered: (tenantId, payload) =>
              plantEventsService.emitAlarmTriggered(tenantId, payload),
          }),
          inject: [PlantEventsService],
        },
      ],
    }).compile();

    alarmEvents = module.get<IPlantAlarmEvents>(PLANT_ALARM_EVENTS);
    jest.clearAllMocks();
  });

  it('routes alarm:triggered through PlantEventsService to PlantGateway', () => {
    const payload = {
      alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
      severity: AlarmSeverity.WARNING,
      stationId: 'ws-1',
      orderId: 'order-1',
      executionId: 'exec-1',
      message: 'Fase excedió tiempo estándar',
    };

    alarmEvents.emitAlarmTriggered('palos-de-lena', payload);

    expect(gatewayMock.emitAlarmTriggered).toHaveBeenCalledWith('palos-de-lena', payload);
    expect(gatewayMock).not.toHaveProperty('server');
  });
});
