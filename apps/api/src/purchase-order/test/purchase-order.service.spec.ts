import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderRepository } from '../repository/purchase-order.repository';
import { PurchaseOrderService } from '../service/purchase-order.service';

const repoMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
};

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOrderService, { provide: PurchaseOrderRepository, useValue: repoMock }],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
    jest.clearAllMocks();
  });

  it('findAll delegates to repository', async () => {
    repoMock.findAll.mockResolvedValue([]);

    const result = await service.findAll('tenant-1');

    expect(result).toEqual([]);
    expect(repoMock.findAll).toHaveBeenCalledWith('tenant-1');
  });

  it('create throws NotImplementedException', async () => {
    await expect(service.create('tenant-1', {})).rejects.toThrow(NotImplementedException);
  });
});
