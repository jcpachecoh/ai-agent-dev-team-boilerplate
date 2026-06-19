import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, IncidentType } from '@prisma/client';
import type { CreateIncidentInput } from '../interfaces/plant.interfaces';
import { IncidentRepository } from '../repository/incident.repository';
import { PlantRepository } from '../repository/plant.repository';
import { ProductionLogRepository } from '../repository/production-log.repository';
import { IncidentService } from '../service/incident.service';
import { PlantEventsService } from '../service/plant-events.service';
import { PlantService } from '../service/plant.service';

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
  locationId: null,
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
    findLocationById: jest.fn(),
  };
  const plantRepositoryMock = {
    findWorkStationById: jest.fn(),
    findExecutionById: jest.fn(),
    findOrderDetailById: jest.fn(),
  };
  const plantEventsServiceMock = {
    emitIncidentCreated: jest.fn(),
  };
  const plantServiceMock = {
    pauseOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentService,
        { provide: IncidentRepository, useValue: incidentRepositoryMock },
        { provide: PlantRepository, useValue: plantRepositoryMock },
        { provide: ProductionLogRepository, useValue: productionLogRepositoryMock },
        { provide: PlantEventsService, useValue: plantEventsServiceMock },
        { provide: PlantService, useValue: plantServiceMock },
      ],
    }).compile();

    service = module.get<IncidentService>(IncidentService);
    jest.clearAllMocks();

    plantRepositoryMock.findWorkStationById.mockResolvedValue({ id: 'ws-1' });
    plantRepositoryMock.findExecutionById.mockResolvedValue({ id: 'exec-1' });
    plantRepositoryMock.findOrderDetailById.mockResolvedValue({ order: { id: 'order-1' } });
    incidentRepositoryMock.createIncident.mockResolvedValue(incidentRecord);
    plantServiceMock.pauseOrder.mockResolvedValue({ id: 'order-1', status: 'PAUSED' });
  });

  describe('createIncident', () => {
    it('creates incident, emits websocket event, and returns response', async () => {
      // Arrange — WARNING severity, no auto-pause
      // Act
      const result = await service.createIncident(tenantId, operatorUserId, createInput);

      // Assert
      expect(incidentRepositoryMock.createIncident).toHaveBeenCalledWith(
        tenantId,
        operatorUserId,
        createInput,
      );
      expect(plantEventsServiceMock.emitIncidentCreated).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ id: 'incident-1', workStationId: 'ws-1' }),
      );
      expect(plantServiceMock.pauseOrder).not.toHaveBeenCalled();
      expect(result.id).toBe('incident-1');
    });

    it('throws BadRequestException when workStationId is outside tenant', async () => {
      // Arrange
      plantRepositoryMock.findWorkStationById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createIncident(tenantId, operatorUserId, createInput)).rejects.toThrow(
        BadRequestException,
      );
      expect(incidentRepositoryMock.createIncident).not.toHaveBeenCalled();
      expect(plantEventsServiceMock.emitIncidentCreated).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when executionId is outside tenant', async () => {
      // Arrange
      plantRepositoryMock.findExecutionById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createIncident(tenantId, operatorUserId, createInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when orderId is outside tenant', async () => {
      // Arrange
      plantRepositoryMock.findOrderDetailById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createIncident(tenantId, operatorUserId, createInput)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when locationId is outside tenant', async () => {
      // Arrange
      incidentRepositoryMock.findLocationById.mockResolvedValue(null);
      const inputWithLocation: CreateIncidentInput = { ...createInput, locationId: 'loc-other' };

      // Act & Assert
      await expect(
        service.createIncident(tenantId, operatorUserId, inputWithLocation),
      ).rejects.toThrow(BadRequestException);
      expect(incidentRepositoryMock.createIncident).not.toHaveBeenCalled();
    });

    it('creates incident successfully when locationId belongs to tenant', async () => {
      // Arrange
      incidentRepositoryMock.findLocationById.mockResolvedValue({ id: 'loc-1' });
      const withLocation: CreateIncidentInput = { ...createInput, locationId: 'loc-1' };
      const recordWithLocation = { ...incidentRecord, locationId: 'loc-1' };
      incidentRepositoryMock.createIncident.mockResolvedValue(recordWithLocation);

      // Act
      const result = await service.createIncident(tenantId, operatorUserId, withLocation);

      // Assert
      expect(incidentRepositoryMock.findLocationById).toHaveBeenCalledWith(tenantId, 'loc-1');
      expect(result.locationId).toBe('loc-1');
    });

    it('skips locationId validation when locationId is absent', async () => {
      // Arrange — createInput has no locationId
      // Act
      await service.createIncident(tenantId, operatorUserId, createInput);

      // Assert
      expect(incidentRepositoryMock.findLocationById).not.toHaveBeenCalled();
    });

    it('auto-pauses order when severity is CRITICAL and orderId is present', async () => {
      // Arrange
      const criticalInput: CreateIncidentInput = {
        ...createInput,
        severity: AlarmSeverity.CRITICAL,
        type: IncidentType.EQUIPMENT,
        description: 'Falla en mezcladora principal',
      };
      const criticalRecord = {
        ...incidentRecord,
        severity: AlarmSeverity.CRITICAL,
        type: IncidentType.EQUIPMENT,
        description: 'Falla en mezcladora principal',
      };
      incidentRepositoryMock.createIncident.mockResolvedValue(criticalRecord);

      // Act
      const result = await service.createIncident(tenantId, operatorUserId, criticalInput);

      // Assert
      expect(result.id).toBe('incident-1');
      expect(plantEventsServiceMock.emitIncidentCreated).toHaveBeenCalledTimes(1);
      expect(plantServiceMock.pauseOrder).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        expect.objectContaining({ reason: expect.stringContaining('Incidente crítico') }),
      );
    });

    it('auto-pauses order when requiresPause is true regardless of severity', async () => {
      // Arrange
      const pauseInput: CreateIncidentInput = {
        ...createInput,
        severity: AlarmSeverity.INFO,
        requiresPause: true,
      };

      // Act
      await service.createIncident(tenantId, operatorUserId, pauseInput);

      // Assert
      expect(plantServiceMock.pauseOrder).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        expect.objectContaining({ reason: expect.stringContaining('Incidente crítico') }),
      );
    });

    it('does NOT auto-pause when severity is CRITICAL but orderId is absent', async () => {
      // Arrange
      const noOrderInput: CreateIncidentInput = {
        ...createInput,
        orderId: null,
        severity: AlarmSeverity.CRITICAL,
      };
      const noOrderRecord = { ...incidentRecord, orderId: null, severity: AlarmSeverity.CRITICAL };
      incidentRepositoryMock.createIncident.mockResolvedValue(noOrderRecord);

      // Act
      const result = await service.createIncident(tenantId, operatorUserId, noOrderInput);

      // Assert
      expect(result.id).toBe('incident-1');
      expect(plantServiceMock.pauseOrder).not.toHaveBeenCalled();
    });

    it('creates incident successfully even when auto-pause throws (order already PAUSED)', async () => {
      // Arrange
      const criticalInput: CreateIncidentInput = {
        ...createInput,
        severity: AlarmSeverity.CRITICAL,
      };
      const criticalRecord = { ...incidentRecord, severity: AlarmSeverity.CRITICAL };
      incidentRepositoryMock.createIncident.mockResolvedValue(criticalRecord);
      plantServiceMock.pauseOrder.mockRejectedValue(
        new ConflictException('Cannot pause order in status PAUSED'),
      );

      // Act — should NOT throw
      const result = await service.createIncident(tenantId, operatorUserId, criticalInput);

      // Assert
      expect(result.id).toBe('incident-1');
      expect(plantEventsServiceMock.emitIncidentCreated).toHaveBeenCalledTimes(1);
    });

    it('creates incident successfully even when auto-pause throws (order COMPLETED)', async () => {
      // Arrange
      const criticalInput: CreateIncidentInput = {
        ...createInput,
        severity: AlarmSeverity.CRITICAL,
      };
      const criticalRecord = { ...incidentRecord, severity: AlarmSeverity.CRITICAL };
      incidentRepositoryMock.createIncident.mockResolvedValue(criticalRecord);
      plantServiceMock.pauseOrder.mockRejectedValue(
        new ConflictException('Cannot pause order in status COMPLETED'),
      );

      // Act
      const result = await service.createIncident(tenantId, operatorUserId, criticalInput);

      // Assert
      expect(result.id).toBe('incident-1');
    });

    it('does NOT auto-pause when severity is WARNING and requiresPause is absent', async () => {
      // Arrange — createInput has WARNING severity, no requiresPause
      // Act
      await service.createIncident(tenantId, operatorUserId, createInput);

      // Assert
      expect(plantServiceMock.pauseOrder).not.toHaveBeenCalled();
    });
  });

  describe('listIncidents', () => {
    it('passes tenant-scoped filters and pagination to repository', async () => {
      // Arrange
      incidentRepositoryMock.findIncidents.mockResolvedValue([incidentRecord]);
      const filters = {
        workStationId: 'ws-1',
        resolved: false,
        severity: AlarmSeverity.WARNING,
      };

      // Act
      const result = await service.listIncidents(tenantId, filters, { limit: 25, offset: 0 });

      // Assert
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
      // Arrange
      incidentRepositoryMock.findIncidentById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.resolveIncident(tenantId, 'missing', operatorUserId, {
          resolution: 'Fixed',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when incident is already resolved', async () => {
      // Arrange
      incidentRepositoryMock.findIncidentById.mockResolvedValue({
        ...incidentRecord,
        resolvedAt: new Date(),
      });

      // Act & Assert
      await expect(
        service.resolveIncident(tenantId, 'incident-1', operatorUserId, {
          resolution: 'Fixed',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('resolves an open incident and sets resolvedBy to the supervisor userId', async () => {
      // Arrange
      const supervisorId = 'supervisor-uuid-1';
      incidentRepositoryMock.findIncidentById.mockResolvedValue(incidentRecord);
      incidentRepositoryMock.resolveIncident.mockResolvedValue({
        ...incidentRecord,
        resolvedAt: new Date('2026-05-28T13:00:00.000Z'),
        resolvedBy: supervisorId,
        resolution: 'Fixed',
      });

      // Act
      const result = await service.resolveIncident(tenantId, 'incident-1', supervisorId, {
        resolution: 'Fixed',
      });

      // Assert
      expect(incidentRepositoryMock.resolveIncident).toHaveBeenCalledWith(
        tenantId,
        'incident-1',
        supervisorId,
        { resolution: 'Fixed' },
      );
      expect(result.resolution).toBe('Fixed');
      expect(result.resolvedBy).toBe(supervisorId);
    });
  });
});
