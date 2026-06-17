import { Test, TestingModule } from '@nestjs/testing';
import { SupplyItemsController } from '../controller/supplyitems.controller';
import { SupplyItemsService } from '../service/supplyitems.service';

const tenantId = 'palos-de-lena';
const mockSupplyItem = {
  id: 'item-1',
  tenantId,
  nombre: 'Insumo Test',
};

const serviceMock = {
  findOne: jest.fn(),
};

describe('SupplyItemsController', () => {
  let controller: SupplyItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplyItemsController],
      providers: [{ provide: SupplyItemsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SupplyItemsController>(SupplyItemsController);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('delegates to SupplyItemsService.findOne with tenantId and id', async () => {
      serviceMock.findOne.mockResolvedValue(mockSupplyItem);

      const result = await controller.findOne('item-1', tenantId);

      expect(result).toEqual(mockSupplyItem);
      expect(serviceMock.findOne).toHaveBeenCalledWith(tenantId, 'item-1');
    });
  });
});
