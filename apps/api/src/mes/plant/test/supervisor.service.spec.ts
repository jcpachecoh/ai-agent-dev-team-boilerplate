import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, IncidentType, PhaseExecutionStatus } from '@prisma/client';
import {
  SupervisorRepository,
  type SupervisorActiveExecution,
} from '../repository/supervisor.repository';
import { SupervisorService } from '../service/supervisor.service';

const tenantId = 'palos-de-lena';

const workStation = {
  id: 'ws-1',
  tenantId,
  code: 'EST-01',
  name: 'Mise en place',
  description: 'Zona preparación',
  location: 'Zona A',
  isActive: true,
  createdAt: new Date('2026-05-28T08:00:00.000Z'),
  updatedAt: new Date('2026-05-28T08:00:00.000Z'),
  deletedAt: null,
};

const inactiveStation = {
  ...workStation,
  id: 'ws-2',
  code: 'EST-02',
  name: 'Línea Fría',
  description: 'Refrigeración',
  isActive: false,
};

function buildExecution(
  overrides: Partial<SupervisorActiveExecution> = {},
): SupervisorActiveExecution {
  return {
    id: 'exec-1',
    workStationId: 'ws-1',
    status: PhaseExecutionStatus.IN_PROCESS,
    plannedMinutes: 60,
    actualMinutes: 45,
    efficiencyPct: null,
    startedAt: new Date('2026-05-28T09:00:00.000Z'),
    order: {
      id: 'order-1',
      number: '000013',
      priority: 'HIGH',
      plannedQuantity: { toString: () => '30' },
      unit: 'KILOGRAMS',
      recipeId: 'recipe-1',
      recipe: { name: 'Costillas BBQ' },
    },
    phase: {
      order: 2,
      name: 'Marinado',
      standardMinutes: 60,
      maxOperators: 3,
    },
    sessions: [
      {
        id: 'session-1',
        operatorUserId: 'op-1',
        startedAt: new Date('2026-05-28T09:05:00.000Z'),
        operator: {
          id: 'op-1',
          user: { email: 'juan.perez@palos-de-lena.dev' },
        },
      },
    ],
    ...overrides,
  };
}

describe('SupervisorService', () => {
  let service: SupervisorService;

  const repositoryMock = {
    findWorkStations: jest.fn(),
    findOpenIncidents: jest.fn(),
    findAllOpenIncidents: jest.fn(),
    findRecentIncidents: jest.fn(),
    findActiveExecutions: jest.fn(),
    countCompletedOrdersToday: jest.fn(),
    countOpenIncidents: jest.fn(),
    findPhaseCountsByRecipe: jest.fn(),
    findWorkStationById: jest.fn(),
    findActiveExecutionForStation: jest.fn(),
    findRecipePhases: jest.fn(),
    findOrderExecutions: jest.fn(),
    findPhasesByTenant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupervisorService, { provide: SupervisorRepository, useValue: repositoryMock }],
    }).compile();

    service = module.get<SupervisorService>(SupervisorService);
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    beforeEach(() => {
      repositoryMock.findWorkStations.mockResolvedValue([workStation, inactiveStation]);
      repositoryMock.findOpenIncidents.mockResolvedValue([
        {
          id: 'inc-1',
          tenantId,
          workStationId: 'ws-1',
          type: IncidentType.QUALITY,
          severity: AlarmSeverity.WARNING,
          description: 'Temperatura fuera de rango',
          createdAt: new Date(Date.now() - 5 * 60_000),
        },
      ]);
      repositoryMock.findAllOpenIncidents.mockResolvedValue([
        {
          id: 'inc-1',
          tenantId,
          workStationId: 'ws-1',
          type: IncidentType.QUALITY,
          severity: AlarmSeverity.WARNING,
          description: 'Temperatura fuera de rango',
          createdAt: new Date(),
        },
      ]);
      repositoryMock.findRecentIncidents.mockResolvedValue([
        {
          id: 'inc-2',
          tenantId,
          type: IncidentType.SAFETY,
          description: '',
          createdAt: new Date('2026-05-28T11:00:00.000Z'),
          resolvedAt: null,
          workStation: { code: 'EST-01', name: 'Mise en place' },
          reporter: { user: { email: 'maria.lopez@palos-de-lena.dev' } },
        },
        {
          id: 'inc-3',
          tenantId,
          type: IncidentType.EQUIPMENT,
          description: '',
          createdAt: new Date('2026-05-28T10:00:00.000Z'),
          resolvedAt: new Date('2026-05-28T10:30:00.000Z'),
          workStation: { code: 'EST-01', name: 'Mise en place' },
          reporter: { user: null },
        },
      ]);
      repositoryMock.findActiveExecutions.mockResolvedValue([buildExecution()]);
      repositoryMock.countCompletedOrdersToday.mockResolvedValue(2);
      repositoryMock.countOpenIncidents.mockResolvedValue(1);
      repositoryMock.findPhaseCountsByRecipe.mockResolvedValue(4);
    });

    it('builds overview with KPIs, stations, alarms and news', async () => {
      const result = await service.getOverview(tenantId);

      expect(result.activeStationCount).toBe(1);
      expect(result.stations).toHaveLength(1);
      expect(result.stations[0]?.code).toBe('EST-01');
      expect(result.stations[0]?.status).toBe('active');
      expect(result.stations[0]?.orderNumber).toBe('OP-000013');
      expect(result.alarms).toHaveLength(1);
      expect(result.alarms[0]?.severity).toBe('alto');
      expect(result.news).toHaveLength(2);
      expect(result.news[0]?.statusTone).toBe('warning');
      expect(result.news[1]?.statusTone).toBe('success');
      expect(result.kpis.find((kpi) => kpi.label === 'Throughput')?.delta).toContain('▲');
      expect(result.kpis.find((kpi) => kpi.label === 'Alarmas activas')?.accent).toBe('danger');
    });

    it('returns idle station card when there is no active execution', async () => {
      repositoryMock.findActiveExecutions.mockResolvedValue([]);

      const result = await service.getOverview(tenantId);

      expect(result.activeStationCount).toBe(0);
      expect(result.stations[0]?.status).toBe('inactive');
      expect(result.stations[0]?.operatorCountLabel).toBe('0 op.');
      expect(result.kpis.find((kpi) => kpi.label === 'Ejecuciones')?.accent).toBe('muted');
    });

    it('uses efficiencyPct when present on execution', async () => {
      repositoryMock.findActiveExecutions.mockResolvedValue([
        buildExecution({ efficiencyPct: { toNumber: () => 105 } }),
      ]);

      const result = await service.getOverview(tenantId);

      expect(result.stations[0]?.efficiencyStatus).toBe('critical');
      expect(result.kpis.find((kpi) => kpi.label === 'OEE Línea')?.accent).toBe('danger');
    });

    it('keeps the most recent execution per station', async () => {
      const older = buildExecution({
        id: 'exec-old',
        startedAt: new Date('2026-05-28T08:00:00.000Z'),
        order: {
          ...buildExecution().order,
          number: 'OP-OLD',
          recipe: { name: 'Receta vieja' },
        },
      });
      const newer = buildExecution({
        id: 'exec-new',
        startedAt: new Date('2026-05-28T10:00:00.000Z'),
        order: {
          ...buildExecution().order,
          number: 'OP-NEW',
          recipe: { name: 'Receta nueva' },
        },
      });
      repositoryMock.findActiveExecutions.mockResolvedValue([older, newer]);

      const result = await service.getOverview(tenantId);

      expect(result.stations[0]?.productName).toBe('Receta nueva');
    });
  });

  describe('getStationLiveDetail', () => {
    it('throws when station does not exist', async () => {
      repositoryMock.findWorkStationById.mockResolvedValue(null);

      await expect(service.getStationLiveDetail(tenantId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns idle detail when station has no active execution', async () => {
      repositoryMock.findWorkStationById.mockResolvedValue(workStation);
      repositoryMock.findActiveExecutionForStation.mockResolvedValue(null);

      const result = await service.getStationLiveDetail(tenantId, workStation.id);

      expect(result).toEqual({
        stationId: workStation.id,
        code: workStation.code,
        name: workStation.name,
        timerLabel: '00:00',
        productName: workStation.description,
      });
    });

    it('returns live detail with phases, operators and formatted order number', async () => {
      repositoryMock.findWorkStationById.mockResolvedValue(workStation);
      repositoryMock.findActiveExecutionForStation.mockResolvedValue(
        buildExecution({
          efficiencyPct: { toNumber: () => 99 },
          order: {
            ...buildExecution().order,
            number: 'OP-000013',
            priority: 'URGENT',
          },
        }),
      );
      repositoryMock.findRecipePhases.mockResolvedValue([
        { order: 1, name: 'Preparación', standardMinutes: 20 },
        { order: 2, name: 'Marinado', standardMinutes: 60 },
      ]);
      repositoryMock.findOrderExecutions.mockResolvedValue([
        {
          status: PhaseExecutionStatus.COMPLETED,
          phase: { order: 1 },
        },
        {
          status: PhaseExecutionStatus.IN_PROCESS,
          phase: { order: 2 },
        },
      ]);

      const result = await service.getStationLiveDetail(tenantId, workStation.id);

      expect(result.orderNumber).toBe('OP-000013');
      expect(result.orderId).toBe('order-1');
      expect(result.progress).toBe(99);
      expect(result.efficiencyStatus).toBe('warning');
      expect(result.exceeded).toBe(false);
      expect(result.phases).toEqual([
        { order: 1, name: 'Preparación', status: 'completed' },
        { order: 2, name: 'Marinado', status: 'in_progress' },
      ]);
      expect(result.operators?.[0]?.initials).toBe('JP');
      expect(result.operators?.[0]?.name).toBe('Juan Perez');
      expect(result.goalLabel).toBe('30 kilograms');
    });

    it('computes progress from actualMinutes when efficiencyPct is missing', async () => {
      repositoryMock.findWorkStationById.mockResolvedValue(workStation);
      repositoryMock.findActiveExecutionForStation.mockResolvedValue(
        buildExecution({
          efficiencyPct: null,
          actualMinutes: 30,
          plannedMinutes: 60,
        }),
      );
      repositoryMock.findRecipePhases.mockResolvedValue([]);
      repositoryMock.findOrderExecutions.mockResolvedValue([]);

      const result = await service.getStationLiveDetail(tenantId, workStation.id);

      expect(result.progress).toBe(50);
      expect(result.efficiencyStatus).toBe('normal');
    });
  });

  describe('getStations', () => {
    it('maps master rows with type, capacity and assigned recipes', async () => {
      repositoryMock.findWorkStations.mockResolvedValue([
        workStation,
        {
          ...inactiveStation,
          name: 'Empaque y Despacho',
          description: 'Zona empaque',
          isActive: true,
        },
      ]);
      repositoryMock.findPhasesByTenant.mockResolvedValue([
        {
          id: 'phase-1',
          tenantId,
          recipeId: 'recipe-1',
          workStationId: 'ws-1',
          order: 1,
          name: 'Preparación',
          maxOperators: 3,
          recipe: { id: 'recipe-1', name: 'Costillas BBQ', isActive: true },
        },
        {
          id: 'phase-2',
          tenantId,
          recipeId: 'recipe-2',
          workStationId: 'ws-1',
          order: 2,
          name: 'Marinado',
          maxOperators: 2,
          recipe: { id: 'recipe-2', name: 'Receta inactiva', isActive: false },
        },
        {
          id: 'phase-3',
          tenantId,
          recipeId: 'recipe-3',
          workStationId: 'ws-2',
          order: 1,
          name: 'Empaque',
          maxOperators: 4,
          recipe: { id: 'recipe-3', name: 'Ensalada', isActive: true },
        },
      ]);
      repositoryMock.findActiveExecutions.mockResolvedValue([
        buildExecution({ workStationId: 'ws-2' }),
      ]);

      const result = await service.getStations(tenantId);

      expect(result.stations).toHaveLength(2);

      const prepStation = result.stations.find((station) => station.id === 'ws-1');
      expect(prepStation?.type).toBe('Preparación');
      expect(prepStation?.typeTone).toBe('preparation');
      expect(prepStation?.capacityLabel).toBe('3 op.');
      expect(prepStation?.recipeCountLabel).toBe('2 recetas');
      expect(prepStation?.assignedRecipes).toHaveLength(1);
      expect(prepStation?.status).toBe('active');

      const packingStation = result.stations.find((station) => station.id === 'ws-2');
      expect(packingStation?.type).toBe('Empaque');
      expect(packingStation?.typeTone).toBe('packing');
      expect(packingStation?.recipeCountLabel).toBe('1 receta');
      expect(packingStation?.location).toBe('Zona A');
    });

    it('marks inactive stations and stations without phases', async () => {
      repositoryMock.findWorkStations.mockResolvedValue([inactiveStation]);
      repositoryMock.findPhasesByTenant.mockResolvedValue([]);
      repositoryMock.findActiveExecutions.mockResolvedValue([]);

      const result = await service.getStations(tenantId);

      expect(result.stations[0]).toMatchObject({
        status: 'inactive',
        capacityLabel: '—',
        recipeCountLabel: '—',
        assignedRecipes: [],
      });
    });
  });
});
