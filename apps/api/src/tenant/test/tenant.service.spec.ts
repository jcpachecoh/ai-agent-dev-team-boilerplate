import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantRepository } from '../repository/tenant.repository';
import { TenantService } from '../service/tenant.service';

const repoMock = {
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

const tenant = {
  id: 'palos-de-lena',
  name: 'Palos de Leña',
  nit: '900000000-1',
  legalName: 'Palos de Leña S.A.S.',
  tradeName: 'Palos de Leña',
  legalRepresentativeName: null,
  legalRepresentativeDocumentType: null,
  legalRepresentativeDocumentNumber: null,
  email: 'admin@palosdelena.test',
  phone: '+57 300 000 0000',
  address: 'Dirección de prueba',
  city: 'Bogotá',
  department: 'Cundinamarca',
  country: 'CO',
  taxRegime: 'RESPONSABLE_IVA',
  logoUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantService, { provide: TenantRepository, useValue: repoMock }],
    }).compile();

    service = module.get<TenantService>(TenantService);
    jest.clearAllMocks();
  });

  it('findById delegates to repository', async () => {
    repoMock.findById.mockResolvedValue(tenant);

    const result = await service.findById('palos-de-lena');

    expect(result).toEqual(tenant);
    expect(repoMock.findById).toHaveBeenCalledWith('palos-de-lena');
  });

  it('findById throws NotFoundException when tenant is missing', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('assertTenantAccess throws ForbiddenException for mismatched tenant', () => {
    expect(() => service.assertTenantAccess('tenant-a', 'tenant-b')).toThrow(ForbiddenException);
  });

  it('update delegates to repository', async () => {
    repoMock.update.mockResolvedValue({ ...tenant, tradeName: 'Nuevo nombre' });

    const result = await service.update('palos-de-lena', { tradeName: 'Nuevo nombre' });

    expect(result.tradeName).toBe('Nuevo nombre');
    expect(repoMock.update).toHaveBeenCalledWith('palos-de-lena', { tradeName: 'Nuevo nombre' });
  });

  it('update throws NotFoundException when tenant is missing', async () => {
    repoMock.update.mockResolvedValue(null);

    await expect(service.update('missing', { tradeName: 'Nuevo nombre' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
