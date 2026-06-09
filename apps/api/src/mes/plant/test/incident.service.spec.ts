import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, IncidentType } from '@prisma/client';
import type { CreateIncidentInput } from '../interfaces/plant.interfaces';
import { IncidentRepository } from '../repository/incident.repository';
import { PlantRepository } from '../repository/plant.repository';
import { IncidentService } from '../service/incident.service';
import { PlantEventsService } from '../service/plant-events.service';

const tenantId = 'palos-de-lena';
const operatorUserId = 'op-user-1';

const createInput: CreateIncidentInput = {
  workStationId: 'ws-1',
  executionId: 'exec-1',
  orderId: 'order-1',
  type: IncidentType.QUALITY,
  severity: AlarmSeverity.WARNING,
  description: 'Producto fuera de spec',
  photoUrl: null,
};

const incidentRecord = {
  id: 'incident-1',
  tenantId,
  orderId: 'order-1',
  executionId: 'exec-1',
  workStationId: 'ws-1',
  operatorUserId,
  type: IncidentType.QUALITY,
  severity: AlarmSeverity.WARNING,
  description: 'Producto fuera de spec',
  photoUrl: null,
  resolvedAt: null,
  resolvedBy: null,
  resolution: null,
  createdAt: new Date('2026-05-28T12:00:00.000Z'),
};

describe('IncidentService', () => {
  let service: IncidentService;
  const incidentRepositoryMock = {
    createIncident: jest.fn(),
    findIncidents: jest.fn(),
    findIncidentById: jest.fn(),
    resolveIncident: jest.fn(),
  };
  const plantRepositoryMock = {
    findWorkStationById: jest.fn(),
    findExecutionById: jest.fn(),
    findOrderDetailById: jest.fn(),
  };
  const plantEventsServiceMock = {
    emitIncidentCreated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentService,
        { provide: IncidentRepository, useValue: incidentRepositoryMock },
        { provide: PlantRepository, useValue: plantRepositoryMock },
        { provide: PlantEventsService, useValue: plantEventsServiceMock },
      ],
    }).compile();

    service = module.get<IncidentService>(IncidentService);
    jest.clearAllMocks();

    plantRepositoryMock.findWorkStationById.mockResolvedValue({ id: 'ws-1' });
    plantRepositoryMock.findExecutionById.mockResolvedValue({ id: 'exec-1' });
    plantRepositoryMock.findOrderDetailById.mockResolvedValue({ order: { id: 'order-1' } });
    incidentRepositoryMock.createIncident.mockResolvedValue(incidentRecord);
  });

  describe('createIncident', () => {
    it('creates incident, emits websocket event, and returns response', async () => {
      const result = await service.createIncident(tenantId, operatorUserId, createInput);

      expect(incidentRepositoryMock.createIncident).toHaveBeenCalledWith(
        tenantId,
        operatorUserId,
        createInput,
      );
      expect(plantEventsServiceMock.emitIncidentCreated).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ id: 'incident-1', workStationId: 'ws-1' }),
      );
      expect(result.id).toBe('incident-1');
    });

    it('throws BadRequestException when workStationId is outside tenant', async () => {
      plantRepositoryMock.findWorkStationById.mockResolvedValue(null);

      await expect(service.createIncident(tenantId, operatorUserId, createInput)).rejects.toThrow(
        BadRequestException,
      );

      expect(incidentRepositoryMock.createIncident).not.toHaveBeenCalled();
      expect(plantEventsServiceMock.emitIncidentCreated).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when executionId is outside tenant', async () => {
      plantRepositoryMock.findExecutionById.mockResolvedValue(null);

      await expect(service.createIncident(tenantId, operatorUserId, createInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when orderId is outside tenant', async () => {
      plantRepositoryMock.findOrderDetailById.mockResolvedValue(null);

      await expect(service.createIncident(tenantId, operatorUserId, createInput)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listIncidents', () => {
    it('passes tenant-scoped filters and pagination to repository', async () => {
      incidentRepositoryMock.findIncidents.mockResolvedValue([incidentRecord]);

      const filters = {
        workStationId: 'ws-1',
        resolved: false,
        severity: AlarmSeverity.WARNING,
      };

      const result = await service.listIncidents(tenantId, filters, { limit: 25, offset: 0 });

      expect(incidentRepositoryMock.findIncidents).toHaveBeenCalledWith(tenantId, filters, {
        limit: 25,
        offset: 0,
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('incident-1');
    });
  });

  describe('resolveIncident', () => {
    it('throws NotFoundException when incident is outside tenant', async () => {
      incidentRepositoryMock.findIncidentById.mockResolvedValue(null);

      await expect(
        service.resolveIncident(tenantId, 'missing', operatorUserId, {
          resolution: 'Fixed',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when incident is already resolved', async () => {
      incidentRepositoryMock.findIncidentById.mockResolvedValue({
        ...incidentRecord,
        resolvedAt: new Date(),
      });

      await expect(
        service.resolveIncident(tenantId, 'incident-1', operatorUserId, {
          resolution: 'Fixed',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('resolves an open incident', async () => {
      incidentRepositoryMock.findIncidentById.mockResolvedValue(incidentRecord);
      incidentRepositoryMock.resolveIncident.mockResolvedValue({
        ...incidentRecord,
        resolvedAt: new Date('2026-05-28T13:00:00.000Z'),
        resolvedBy: operatorUserId,
        resolution: 'Fixed',
      });

      const result = await service.resolveIncident(tenantId, 'incident-1', operatorUserId, {
        resolution: 'Fixed',
      });

      expect(incidentRepositoryMock.resolveIncident).toHaveBeenCalledWith(
        tenantId,
        'incident-1',
        operatorUserId,
        { resolution: 'Fixed' },
      );
      expect(result.resolution).toBe('Fixed');
    });
  });
});
