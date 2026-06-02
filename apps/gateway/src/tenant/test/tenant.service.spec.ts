import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from '../service/tenant.service';
import { TenantRepository } from '../repository/tenant.repository';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: TenantRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue({ id: 't1', name: 'Tenant t1' }),
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();
    service = module.get<TenantService>(TenantService);
  });

  it('findById returns stub tenant', async () => {
    const result = await service.findById('t1');
    expect(result?.name).toBe('Tenant t1');
  });

  it('findAll returns empty array', async () => {
    const result = await service.findAll();
    expect(result).toEqual([]);
  });
});
