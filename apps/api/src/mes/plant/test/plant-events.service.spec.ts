import { PhaseExecutionStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PlantGateway } from '../gateway/plant.gateway';
import type { PhaseStatusChange } from '../interfaces/plant.interfaces';
import { PlantEventsService } from '../service/plant-events.service';

const plantGatewayMock = {
  emitPhaseStatusChanged: jest.fn(),
  emitAlarmTriggered: jest.fn(),
  emitIncidentCreated: jest.fn(),
};

describe('PlantEventsService', () => {
  let service: PlantEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlantEventsService, { provide: PlantGateway, useValue: plantGatewayMock }],
    }).compile();

    service = module.get(PlantEventsService);
    jest.clearAllMocks();
  });

  it('emitPhaseStatusChanges forwards each change with tenant room payload', () => {
    const changes: PhaseStatusChange[] = [
      {
        id: 'exec-1',
        orderId: 'order-1',
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.IN_PROCESS,
      },
    ];

    service.emitPhaseStatusChanges('tenant-1', changes);

    expect(plantGatewayMock.emitPhaseStatusChanged).toHaveBeenCalledWith('tenant-1', {
      orderId: 'order-1',
      phaseId: 'phase-1',
      stationId: 'ws-1',
      status: PhaseExecutionStatus.IN_PROCESS,
    });
  });
});
