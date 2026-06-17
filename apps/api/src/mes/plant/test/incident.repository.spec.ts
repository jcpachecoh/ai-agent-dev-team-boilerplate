import { Test, TestingModule } from '@nestjs/testing';
import { AlarmSeverity, IncidentType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_INCIDENT_LIST_LIMIT, IncidentRepository } from '../repository/incident.repository';

const tenantId = 'palos-de-lena';
const incidentId = 'incident-1';

const prismaMock = {
  productionIncident: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    findFirst: jest.fn(),
  },
  location: {
    findFirst: jest.fn(),
  },
};

describe('IncidentRepository', () => {
  let repository: IncidentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<IncidentRepository>(IncidentRepository);
    jest.clearAllMocks();
  });

  describe('createIncident', () => {
    it('persists tenant-scoped incident with nullable refs', async () => {
      const created = { id: incidentId, tenantId };
      prismaMock.productionIncident.create.mockResolvedValue(created);

      const result = await repository.createIncident(tenantId, 'op-1', {
        workStationId: 'ws-1',
        executionId: 'exec-1',
        orderId: 'order-1',
        type: IncidentType.QUALITY,
        severity: AlarmSeverity.WARNING,
        description: 'Producto fuera de spec',
        photoUrl: null,
      });

      expect(prismaMock.productionIncident.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          operatorUserId: 'op-1',
          workStationId: 'ws-1',
          locationId: null,
          executionId: 'exec-1',
          orderId: 'order-1',
          type: IncidentType.QUALITY,
          severity: AlarmSeverity.WARNING,
          description: 'Producto fuera de spec',
          photoUrl: null,
        },
      });
      expect(result).toBe(created);
    });

    it('persists locationId when provided', async () => {
      const created = { id: incidentId, tenantId, locationId: 'loc-1' };
      prismaMock.productionIncident.create.mockResolvedValue(created);

      await repository.createIncident(tenantId, 'op-1', {
        workStationId: 'ws-1',
        locationId: 'loc-1',
        type: IncidentType.SAFETY,
        severity: AlarmSeverity.CRITICAL,
        description: 'Incidente',
        photoUrl: null,
      });

      expect(prismaMock.productionIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ locationId: 'loc-1' }),
      });
    });
  });

  describe('findIncidents', () => {
    it('applies tenant filters and default pagination', async () => {
      prismaMock.productionIncident.findMany.mockResolvedValue([]);

      await repository.findIncidents(tenantId, {
        workStationId: 'ws-1',
        orderId: 'order-1',
        type: IncidentType.SAFETY,
        severity: AlarmSeverity.CRITICAL,
        resolved: false,
      });

      expect(prismaMock.productionIncident.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          orderId: 'order-1',
          workStationId: 'ws-1',
          locationId: undefined,
          type: IncidentType.SAFETY,
          severity: AlarmSeverity.CRITICAL,
          resolvedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: DEFAULT_INCIDENT_LIST_LIMIT,
        skip: 0,
      });
    });

    it('filters by locationId when provided', async () => {
      prismaMock.productionIncident.findMany.mockResolvedValue([]);

      await repository.findIncidents(tenantId, { locationId: 'loc-1' });

      expect(prismaMock.productionIncident.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId, locationId: 'loc-1' }),
        orderBy: { createdAt: 'desc' },
        take: DEFAULT_INCIDENT_LIST_LIMIT,
        skip: 0,
      });
    });

    it('supports resolved=true filter and custom pagination', async () => {
      prismaMock.productionIncident.findMany.mockResolvedValue([]);

      await repository.findIncidents(tenantId, { resolved: true }, { limit: 10, offset: 5 });

      expect(prismaMock.productionIncident.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          orderId: undefined,
          workStationId: undefined,
          locationId: undefined,
          type: undefined,
          severity: undefined,
          resolvedAt: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 5,
      });
    });
  });

  describe('findIncidentById', () => {
    it('scopes lookup by tenant and id', async () => {
      prismaMock.productionIncident.findFirst.mockResolvedValue({ id: incidentId });

      await repository.findIncidentById(tenantId, incidentId);

      expect(prismaMock.productionIncident.findFirst).toHaveBeenCalledWith({
        where: { id: incidentId, tenantId },
      });
    });
  });

  describe('findLocationById', () => {
    it('returns location when found for tenant', async () => {
      // Arrange
      prismaMock.location.findFirst.mockResolvedValue({ id: 'loc-1' });

      // Act
      const result = await repository.findLocationById(tenantId, 'loc-1');

      // Assert
      expect(prismaMock.location.findFirst).toHaveBeenCalledWith({
        where: { id: 'loc-1', tenantId, deletedAt: null },
        select: { id: true },
      });
      expect(result).toEqual({ id: 'loc-1' });
    });

    it('returns null when location not found or belongs to another tenant', async () => {
      // Arrange
      prismaMock.location.findFirst.mockResolvedValue(null);

      // Act
      const result = await repository.findLocationById(tenantId, 'loc-other');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('resolveIncident', () => {
    it('updates only when id and tenantId match', async () => {
      const resolvedIncident = {
        id: incidentId,
        tenantId,
        resolvedAt: new Date('2026-05-28T13:00:00.000Z'),
        resolvedBy: 'supervisor-1',
        resolution: 'Fixed',
      };

      prismaMock.productionIncident.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.productionIncident.findFirst.mockResolvedValue(resolvedIncident);

      const result = await repository.resolveIncident(tenantId, incidentId, 'supervisor-1', {
        resolution: 'Fixed',
      });

      expect(prismaMock.productionIncident.updateMany).toHaveBeenCalledWith({
        where: { id: incidentId, tenantId },
        data: {
          resolvedAt: expect.any(Date),
          resolvedBy: 'supervisor-1',
          resolution: 'Fixed',
        },
      });
      expect(prismaMock.productionIncident.findFirst).toHaveBeenCalledWith({
        where: { id: incidentId, tenantId },
      });
      expect(result).toBe(resolvedIncident);
    });

    it('does not update when tenantId does not match', async () => {
      prismaMock.productionIncident.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        repository.resolveIncident('other-tenant', incidentId, 'supervisor-1', {
          resolution: 'Fixed',
        }),
      ).rejects.toThrow(`ProductionIncident ${incidentId} not found for tenant other-tenant`);

      expect(prismaMock.productionIncident.findFirst).not.toHaveBeenCalled();
    });

    it('throws when updated incident cannot be reloaded', async () => {
      prismaMock.productionIncident.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.productionIncident.findFirst.mockResolvedValue(null);

      await expect(
        repository.resolveIncident(tenantId, incidentId, 'supervisor-1', {
          resolution: 'Fixed',
        }),
      ).rejects.toThrow(`ProductionIncident ${incidentId} not found for tenant ${tenantId}`);
    });
  });
});
