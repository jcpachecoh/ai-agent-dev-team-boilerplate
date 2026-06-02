import { Test, TestingModule } from '@nestjs/testing';
import { NotImplementedException } from '@nestjs/common';
import { PurchaseOrderService } from '../service/purchase-order.service';
import { PurchaseOrderRepository } from '../repository/purchase-order.repository';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        {
          provide: PurchaseOrderRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();
    service = module.get<PurchaseOrderService>(PurchaseOrderService);
  });

  it('findAll returns empty array', async () => {
    const result = await service.findAll('tenant-1');
    expect(result).toEqual([]);
  });

  it('create throws NotImplementedException', async () => {
    await expect(service.create('tenant-1', {})).rejects.toThrow(NotImplementedException);
  });
});
