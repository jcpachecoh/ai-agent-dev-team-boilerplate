import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupplierLogisticsStatus } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import { SupplierLogisticsRepository } from '../repository/supplier-logistics.repository';
import { SupplierLogisticsService } from '../service/supplier-logistics.service';

describe('SupplierLogisticsService', () => {
  let service: SupplierLogisticsService;
  let repository: jest.Mocked<SupplierLogisticsRepository>;
  let auditService: jest.Mocked<AuditService>;

  const tenantId = 'tenant-1';
  const supplierId = 'sup-1';

  const completeInput = {
    deliveryMode: 'SUPPLIER_DELIVERS' as const,
    deliveryPlace: 'PLANT' as const,
    deliveryDays: [1, 3, 5],
    leadTimeDays: 3,
    receptionResponsibleUserId: 'user-1',
    transportType: 'OWN' as const,
    requiresColdChain: false,
    coverageLocationIds: ['loc-1'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierLogisticsService,
        {
          provide: SupplierLogisticsRepository,
          useValue: {
            findBySupplierId: jest.fn(),
            upsert: jest.fn(),
            findUserInTenant: jest.fn(),
            findLocationsInTenant: jest.fn(),
            findHistory: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SupplierLogisticsService);
    repository = module.get(SupplierLogisticsRepository);
    auditService = module.get(AuditService);
  });

  it('rejects complete logistics without delivery days', async () => {
    await expect(
      service.upsert({
        tenantId,
        supplierId,
        input: { ...completeInput, deliveryDays: [] },
        saveAsDraft: false,
      }),
    ).rejects.toThrow('Selecciona al menos un día de entrega');
  });

  it('requires temperature range when cold chain is enabled', async () => {
    await expect(
      service.upsert({
        tenantId,
        supplierId,
        input: {
          ...completeInput,
          requiresColdChain: true,
        },
        saveAsDraft: false,
      }),
    ).rejects.toThrow('Temperatura mínima requerida con cadena de frío');
  });

  it('allows draft logistics without required fields', async () => {
    repository.upsert.mockResolvedValue({
      id: 'log-1',
      tenantId,
      supplierId,
      deliveryMode: null,
      deliveryPlace: null,
      deliveryPlaceCustom: null,
      deliveryDays: [],
      leadTimeDays: null,
      timeWindowStart: null,
      timeWindowEnd: null,
      receptionResponsibleUserId: null,
      transportType: null,
      requiresColdChain: false,
      transportTempMinC: null,
      transportTempMaxC: null,
      transportCost: null,
      transportCostCurrency: null,
      minimumOrderQty: null,
      minimumOrderUnit: null,
      status: SupplierLogisticsStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      receptionResponsibleUser: null,
      coverageLocations: [],
    });

    const result = await service.upsert({
      tenantId,
      supplierId,
      input: {},
      saveAsDraft: true,
    });

    expect(result.status).toBe('DRAFT');
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: SupplierLogisticsStatus.DRAFT }),
    );
  });

  it('blocks coverage locations from another tenant', async () => {
    repository.findUserInTenant.mockResolvedValue({ id: 'user-1' } as any);
    repository.findLocationsInTenant.mockResolvedValue([]);

    await expect(
      service.upsert({
        tenantId,
        supplierId,
        input: completeInput,
        saveAsDraft: false,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('marks reception responsible as stale when user is inactive', async () => {
    repository.findBySupplierId.mockResolvedValue({
      id: 'log-1',
      tenantId,
      supplierId,
      deliveryMode: 'SUPPLIER_DELIVERS',
      deliveryPlace: 'PLANT',
      deliveryPlaceCustom: null,
      deliveryDays: [1],
      leadTimeDays: 2,
      timeWindowStart: null,
      timeWindowEnd: null,
      receptionResponsibleUserId: 'user-1',
      transportType: 'OWN',
      requiresColdChain: false,
      transportTempMinC: null,
      transportTempMaxC: null,
      transportCost: null,
      transportCostCurrency: null,
      minimumOrderQty: null,
      minimumOrderUnit: null,
      status: SupplierLogisticsStatus.COMPLETE,
      createdAt: new Date(),
      updatedAt: new Date(),
      receptionResponsibleUser: {
        id: 'user-1',
        email: 'inactive@example.com',
        deletedAt: new Date(),
        isActive: false,
      } as any,
      coverageLocations: [],
    });

    const result = await service.findBySupplierId(tenantId, supplierId);

    expect(result?.receptionResponsibleStale).toBe(true);
  });

  it('writes audit log when completing logistics update', async () => {
    repository.findUserInTenant.mockResolvedValue({ id: 'user-1' } as any);
    repository.findLocationsInTenant.mockResolvedValue([{ id: 'loc-1' }] as any);
    repository.findBySupplierId.mockResolvedValue({
      id: 'log-1',
      tenantId,
      supplierId,
      deliveryMode: 'SUPPLIER_DELIVERS',
      deliveryPlace: 'PLANT',
      deliveryPlaceCustom: null,
      deliveryDays: [1],
      leadTimeDays: 2,
      timeWindowStart: null,
      timeWindowEnd: null,
      receptionResponsibleUserId: 'user-1',
      transportType: 'OWN',
      requiresColdChain: false,
      transportTempMinC: null,
      transportTempMaxC: null,
      transportCost: null,
      transportCostCurrency: null,
      minimumOrderQty: null,
      minimumOrderUnit: null,
      status: SupplierLogisticsStatus.COMPLETE,
      createdAt: new Date(),
      updatedAt: new Date(),
      receptionResponsibleUser: {
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
        deletedAt: null,
      } as any,
      coverageLocations: [],
    });
    repository.upsert.mockResolvedValue({
      id: 'log-1',
      tenantId,
      supplierId,
      deliveryMode: 'SUPPLIER_DELIVERS',
      deliveryPlace: 'PLANT',
      deliveryPlaceCustom: null,
      deliveryDays: [1, 2, 3],
      leadTimeDays: 5,
      timeWindowStart: null,
      timeWindowEnd: null,
      receptionResponsibleUserId: 'user-1',
      transportType: 'OWN',
      requiresColdChain: false,
      transportTempMinC: null,
      transportTempMaxC: null,
      transportCost: null,
      transportCostCurrency: null,
      minimumOrderQty: null,
      minimumOrderUnit: null,
      status: SupplierLogisticsStatus.COMPLETE,
      createdAt: new Date(),
      updatedAt: new Date(),
      receptionResponsibleUser: {
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
        deletedAt: null,
      } as any,
      coverageLocations: [
        { locationId: 'loc-1', location: { id: 'loc-1', name: 'Sede 1' } as any },
      ],
    });

    await service.upsert({
      tenantId,
      supplierId,
      input: completeInput,
      saveAsDraft: false,
      actorUserId: 'actor-1',
    });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'SupplierLogistics',
        actorUserId: 'actor-1',
      }),
    );
  });
});
