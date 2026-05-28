import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, IncidentType, PhaseExecutionStatus, PlantAlarmType } from '@prisma/client';
import { PlantGateway } from '../gateway/plant.gateway';
import { PlantEventsService } from '../service/plant-events.service';

describe('PlantGateway', () => {
  let gateway: PlantGateway;
  let jwtService: { verifyAsync: jest.Mock };
  const emitMock = jest.fn();
  const toMock = jest.fn().mockReturnValue({ emit: emitMock });

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantGateway,
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    gateway = module.get<PlantGateway>(PlantGateway);
    gateway.server = { to: toMock } as never;
    jest.clearAllMocks();
  });

  it('emitAlarmTriggered broadcasts alarm:triggered to tenant and station rooms', () => {
    const payload = {
      alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
      severity: AlarmSeverity.WARNING,
      stationId: 'ws-1',
      orderId: 'order-1',
      executionId: 'exec-1',
      message: 'Fase excedió tiempo estándar',
    };

    gateway.emitAlarmTriggered('palos-de-lena', payload);

    expect(toMock).toHaveBeenCalledWith('tenant:palos-de-lena');
    expect(toMock).toHaveBeenCalledWith('station:ws-1');
    expect(emitMock).toHaveBeenCalledWith('alarm:triggered', payload);
    expect(emitMock).toHaveBeenCalledTimes(2);
  });

  it('emitIncidentCreated broadcasts incident:created to tenant and station rooms', () => {
    const payload = {
      incidentId: 'incident-1',
      stationId: 'ws-1',
      orderId: 'order-1',
      executionId: 'exec-1',
      type: IncidentType.QUALITY,
      severity: AlarmSeverity.CRITICAL,
    };

    gateway.emitIncidentCreated('palos-de-lena', payload);

    expect(toMock).toHaveBeenCalledWith('tenant:palos-de-lena');
    expect(toMock).toHaveBeenCalledWith('station:ws-1');
    expect(emitMock).toHaveBeenCalledWith('incident:created', payload);
    expect(emitMock).toHaveBeenCalledTimes(2);
  });

  it('emitPhaseStatusChanged broadcasts phase:status_changed to tenant room', () => {
    const payload = {
      orderId: 'order-1',
      phaseId: 'phase-1',
      stationId: 'ws-1',
      status: 'READY',
    };

    gateway.emitPhaseStatusChanged('palos-de-lena', payload);

    expect(toMock).toHaveBeenCalledWith('tenant:palos-de-lena');
    expect(emitMock).toHaveBeenCalledWith('phase:status_changed', payload);
  });

  it('does not emit when server is not initialized', () => {
    gateway.server = undefined as never;

    gateway.emitPhaseStatusChanged('palos-de-lena', {
      orderId: 'order-1',
      phaseId: 'phase-1',
      stationId: 'ws-1',
      status: 'READY',
    });

    expect(toMock).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('does not emit alarm:triggered when server is not initialized', () => {
    gateway.server = undefined as never;

    gateway.emitAlarmTriggered('palos-de-lena', {
      alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
      severity: AlarmSeverity.WARNING,
      stationId: 'ws-1',
      message: 'Fase excedió tiempo estándar',
    });

    expect(toMock).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('does not emit incident:created when server is not initialized', () => {
    gateway.server = undefined as never;

    gateway.emitIncidentCreated('palos-de-lena', {
      incidentId: 'incident-1',
      stationId: 'ws-1',
      type: IncidentType.QUALITY,
      severity: AlarmSeverity.WARNING,
    });

    expect(toMock).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('handleConnection joins tenant and station rooms when JWT is valid', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'op-1',
      tenantId: 'palos-de-lena',
      role: 'OWNER',
      cedulaHash: 'hash',
      sedeId: null,
    });

    const join = jest.fn();
    const disconnect = jest.fn();
    const client = {
      handshake: {
        auth: { token: 'valid-token', stationId: 'ws-1' },
        headers: {},
        query: {},
      },
      data: {},
      join,
      disconnect,
    };

    await gateway.handleConnection(client as never);

    expect(join).toHaveBeenCalledWith('tenant:palos-de-lena');
    expect(join).toHaveBeenCalledWith('station:ws-1');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('handleConnection disconnects when token is missing', async () => {
    const disconnect = jest.fn();
    const client = {
      handshake: { auth: {}, headers: {}, query: {} },
      disconnect,
    };

    await gateway.handleConnection(client as never);

    expect(disconnect).toHaveBeenCalledWith(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('handleConnection accepts Authorization bearer token', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'op-1',
      tenantId: 'palos-de-lena',
      role: 'OWNER',
      cedulaHash: 'hash',
      sedeId: null,
    });

    const join = jest.fn();
    const client = {
      handshake: {
        auth: {},
        headers: { authorization: 'Bearer header-token' },
        query: { stationId: 'ws-2' },
      },
      data: {},
      join,
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token');
    expect(join).toHaveBeenCalledWith('station:ws-2');
  });

  it('handleConnection reads stationId from query array', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'op-1',
      tenantId: 'palos-de-lena',
      role: 'OWNER',
      cedulaHash: 'hash',
      sedeId: null,
    });

    const join = jest.fn();
    const client = {
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
        query: { stationId: ['ws-array'] },
      },
      data: {},
      join,
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(join).toHaveBeenCalledWith('station:ws-array');
  });
});

describe('PlantEventsService', () => {
  it('maps phase status changes to websocket payload shape', () => {
    const gatewayMock = { emitPhaseStatusChanged: jest.fn() };
    const events = new PlantEventsService(gatewayMock as never);

    events.emitPhaseStatusChanges('palos-de-lena', [
      {
        id: 'exec-1',
        orderId: 'order-1',
        phaseId: 'phase-1',
        workStationId: 'ws-1',
        status: PhaseExecutionStatus.READY,
      },
    ]);

    expect(gatewayMock.emitPhaseStatusChanged).toHaveBeenCalledWith('palos-de-lena', {
      orderId: 'order-1',
      phaseId: 'phase-1',
      stationId: 'ws-1',
      status: PhaseExecutionStatus.READY,
    });
  });

  it('delegates emitAlarmTriggered to gateway', () => {
    const gatewayMock = { emitAlarmTriggered: jest.fn() };
    const events = new PlantEventsService(gatewayMock as never);
    const payload = {
      alarmType: PlantAlarmType.OP_RETRASADA,
      severity: AlarmSeverity.INFO,
      stationId: 'ws-2',
      message: 'Orden retrasada',
    };

    events.emitAlarmTriggered('palos-de-lena', payload);

    expect(gatewayMock.emitAlarmTriggered).toHaveBeenCalledWith('palos-de-lena', payload);
  });

  it('maps incident response to incident:created websocket payload', () => {
    const gatewayMock = { emitIncidentCreated: jest.fn() };
    const events = new PlantEventsService(gatewayMock as never);

    events.emitIncidentCreated('palos-de-lena', {
      id: 'incident-1',
      tenantId: 'palos-de-lena',
      orderId: 'order-1',
      executionId: null,
      workStationId: 'ws-1',
      operatorUserId: 'op-1',
      type: IncidentType.SAFETY,
      severity: AlarmSeverity.WARNING,
      description: 'Derrame en línea 1',
      photoUrl: null,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      createdAt: new Date('2026-05-27T12:00:00.000Z'),
    });

    expect(gatewayMock.emitIncidentCreated).toHaveBeenCalledWith('palos-de-lena', {
      incidentId: 'incident-1',
      stationId: 'ws-1',
      orderId: 'order-1',
      type: IncidentType.SAFETY,
      severity: AlarmSeverity.WARNING,
    });
  });
});
