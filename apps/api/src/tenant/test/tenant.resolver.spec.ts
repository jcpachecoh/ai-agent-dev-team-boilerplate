import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolver } from '../resolver/tenant.resolver';
import { TenantService } from '../service/tenant.service';

const serviceMock = {
  findById: jest.fn(),
  findAll: jest.fn(),
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

  it('delegates tenant lookup to service', async () => {
    serviceMock.findById.mockResolvedValue({ id: 't-1', name: 'Tenant t-1' });

    const result = await resolver.tenant('t-1');

    expect(result).toEqual({ id: 't-1', name: 'Tenant t-1' });
    expect(serviceMock.findById).toHaveBeenCalledWith('t-1');
  });

  it('returns empty list when no tenants exist', async () => {
    serviceMock.findAll.mockResolvedValue([]);

    const result = await resolver.tenants();

    expect(result).toEqual([]);
    expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
  });
});
