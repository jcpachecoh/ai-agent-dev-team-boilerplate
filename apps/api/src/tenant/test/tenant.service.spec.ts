import { Test, TestingModule } from '@nestjs/testing';
import { TenantRepository } from '../repository/tenant.repository';
import { TenantService } from '../service/tenant.service';

const repoMock = {
  findById: jest.fn(),
  findAll: jest.fn(),
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
    repoMock.findById.mockResolvedValue({ id: 't-1', name: 'Tenant t-1' });

    const result = await service.findById('t-1');

    expect(result).toEqual({ id: 't-1', name: 'Tenant t-1' });
    expect(repoMock.findById).toHaveBeenCalledWith('t-1');
  });

  it('findAll returns empty list when no tenants exist', async () => {
    repoMock.findAll.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });
});
