import { Test, TestingModule } from '@nestjs/testing';
import { SupplyItemService } from '../service/supply-item.service';
import { SupplyItemRepository } from '../repository/supply-item.repository';

describe('SupplyItemService', () => {
  let service: SupplyItemService;
  let repository: jest.Mocked<SupplyItemRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyItemService,
        {
          provide: SupplyItemRepository,
          useValue: { findAll: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SupplyItemService>(SupplyItemService);
    repository = module.get(SupplyItemRepository);
  });

  afterEach(() => jest.resetAllMocks());

  it('delegates to repository', async () => {
    repository.findAll.mockResolvedValue([]);
    const result = await service.findAll('tenant-1', { search: 'harina', limit: 10 });
    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith('tenant-1', { search: 'harina', limit: 10 });
  });
});
