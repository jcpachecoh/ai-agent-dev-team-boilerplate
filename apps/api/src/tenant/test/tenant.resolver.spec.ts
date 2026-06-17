import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolver } from '../resolver/tenant.resolver';
import { TenantService } from '../service/tenant.service';

const serviceMock = {
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  assertTenantAccess: jest.fn(),
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

const user = {
  tenantId: 'palos-de-lena',
  sub: 'user-1',
  email: 'owner@test.com',
  roleCode: 'OWNER',
  roleId: 'role-owner',
};

describe('TenantResolver', () => {
  let resolver: TenantResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantResolver, { provide: TenantService, useValue: serviceMock }],
    }).compile();

    resolver = module.get<TenantResolver>(TenantResolver);
    jest.clearAllMocks();
  });

  it('myTenant delegates to service with jwt tenantId', async () => {
    serviceMock.findById.mockResolvedValue(tenant);

    const result = await resolver.myTenant(user);

    expect(result.id).toBe('palos-de-lena');
    expect(serviceMock.findById).toHaveBeenCalledWith('palos-de-lena');
  });

  it('tenant asserts tenant access before lookup', async () => {
    serviceMock.findById.mockResolvedValue(tenant);

    const result = await resolver.tenant(user, 'palos-de-lena');

    expect(serviceMock.assertTenantAccess).toHaveBeenCalledWith('palos-de-lena', 'palos-de-lena');
    expect(result.legalName).toBe('Palos de Leña S.A.S.');
  });

  it('updateTenant delegates to service', async () => {
    serviceMock.update.mockResolvedValue({ ...tenant, tradeName: 'Nuevo nombre' });

    const result = await resolver.updateTenant(user, { tradeName: 'Nuevo nombre' });

    expect(serviceMock.update).toHaveBeenCalledWith('palos-de-lena', {
      tradeName: 'Nuevo nombre',
      nit: undefined,
      address: undefined,
      phone: undefined,
      email: undefined,
    });
    expect(result.tradeName).toBe('Nuevo nombre');
  });
});
