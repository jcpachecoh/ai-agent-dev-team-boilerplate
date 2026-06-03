import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
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
  findAll: jest.fn(),
};

const allowGuard: CanActivate = { canActivate: () => true };

describe('SupplyItemsController', () => {
  let controller: SupplyItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplyItemsController],
      providers: [{ provide: SupplyItemsService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get<SupplyItemsController>(SupplyItemsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to SupplyItemsService.findAll with tenantId and options', async () => {
      serviceMock.findAll.mockResolvedValue([mockSupplyItem]);

      const result = await controller.findAll(tenantId, 'aceite', '25');

      expect(result).toEqual([mockSupplyItem]);
      expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, {
        search: 'aceite',
        limit: 25,
      });
    });
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
