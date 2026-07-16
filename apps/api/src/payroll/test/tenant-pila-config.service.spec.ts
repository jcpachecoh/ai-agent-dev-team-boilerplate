import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeeCatalogType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeCatalogRepository } from '../repository/employee-catalog.repository';
import { TenantPilaConfigRepository } from '../repository/tenant-pila-config.repository';
import { TenantPilaConfigService } from '../service/tenant-pila-config.service';

describe('TenantPilaConfigService', () => {
  let service: TenantPilaConfigService;
  let repository: jest.Mocked<TenantPilaConfigRepository>;
  let catalogRepository: { findActiveByTypeAndPilaCode: jest.Mock };
  let prisma: { tenant: { findFirst: jest.Mock } };

  const tenantId = 'tenant-1';
  const baseRecord = {
    id: 'cfg-1',
    tenantId,
    documentType: 'NI',
    claseAportante: 'B',
    naturalezaJuridica: '2',
    formaPresentacion: 'U',
    tipoAportante: '01',
    arlCode: '14-11',
    actividadEconomicaArl: '5611001',
    exemptFromHealthSenaIcbfLey1607: false,
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findFirst: jest.fn().mockResolvedValue({ id: tenantId }),
      },
    };
    repository = {
      findByTenantId: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<TenantPilaConfigRepository>;
    catalogRepository = {
      findActiveByTypeAndPilaCode: jest.fn().mockResolvedValue({
        id: 'arl-1',
        tenantId,
        type: EmployeeCatalogType.ARL,
        name: 'ARL Sura',
        pilaCode: '14-11',
        isActive: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantPilaConfigService,
        { provide: TenantPilaConfigRepository, useValue: repository },
        { provide: EmployeeCatalogRepository, useValue: catalogRepository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TenantPilaConfigService);
  });

  it('findByTenantId delega al repository (relación 1:1 por tenantId)', async () => {
    repository.findByTenantId.mockResolvedValue(baseRecord);
    await expect(service.findByTenantId(tenantId)).resolves.toEqual(baseRecord);
    expect(repository.findByTenantId).toHaveBeenCalledWith(tenantId);
  });

  it('upsert crea/actualiza cuando el tenant existe, campos válidos y ARL en catálogo', async () => {
    repository.upsert.mockResolvedValue(baseRecord);
    const result = await service.upsert(tenantId, {
      arlCode: '14-11',
      actividadEconomicaArl: '5611001',
      formaPresentacion: 'U',
    });
    expect(result).toEqual(baseRecord);
    expect(catalogRepository.findActiveByTypeAndPilaCode).toHaveBeenCalledWith(
      tenantId,
      EmployeeCatalogType.ARL,
      '14-11',
    );
    expect(repository.upsert).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ arlCode: '14-11', actividadEconomicaArl: '5611001' }),
    );
  });

  it('upsert lanza NotFoundException si el tenant no existe', async () => {
    prisma.tenant.findFirst.mockResolvedValue(null);
    await expect(service.upsert(tenantId, { arlCode: '14-11' })).rejects.toThrow(NotFoundException);
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('rechaza arlCode que no existe en catálogo ARL del tenant', async () => {
    catalogRepository.findActiveByTypeAndPilaCode.mockResolvedValue(null);
    await expect(service.upsert(tenantId, { arlCode: '14-99' })).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('rechaza actividadEconomicaArl con longitud distinta de 7', async () => {
    await expect(service.upsert(tenantId, { actividadEconomicaArl: '5611' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza formaPresentacion inválida', async () => {
    await expect(service.upsert(tenantId, { formaPresentacion: 'X' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza arlCode con caracteres inválidos', async () => {
    await expect(service.upsert(tenantId, { arlCode: '14 11!' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza documentType / clase / naturaleza / tipoAportante inválidos', async () => {
    await expect(service.upsert(tenantId, { documentType: 'XX' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.upsert(tenantId, { claseAportante: 'Z' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.upsert(tenantId, { naturalezaJuridica: '9' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.upsert(tenantId, { tipoAportante: '1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('permite arlCode null y actividadEconomicaArl null sin consultar catálogo', async () => {
    repository.upsert.mockResolvedValue(baseRecord);
    await service.upsert(tenantId, { arlCode: null, actividadEconomicaArl: null });
    expect(catalogRepository.findActiveByTypeAndPilaCode).not.toHaveBeenCalled();
    expect(repository.upsert).toHaveBeenCalled();
  });

  it('no lee catálogo de otro tenant (siempre pasa tenantId del upsert)', async () => {
    repository.upsert.mockResolvedValue(baseRecord);
    await service.upsert('tenant-A', { arlCode: '14-11' });
    expect(catalogRepository.findActiveByTypeAndPilaCode).toHaveBeenCalledWith(
      'tenant-A',
      EmployeeCatalogType.ARL,
      '14-11',
    );
  });
});
