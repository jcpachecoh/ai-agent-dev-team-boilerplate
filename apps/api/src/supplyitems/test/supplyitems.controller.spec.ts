import { Test, TestingModule } from '@nestjs/testing';
import { StockUnit } from '@prisma/client';
import { SupplyItemsController } from '../controller/supplyitems.controller';
import { SupplyItemsService } from '../service/supplyitems.service';

const tenantId = 'palos-de-lena';
const mockSupplyItem = {
  id: 'item-1',
  tenantId,
  nombre: 'Insumo Test',
  codigoInterno: 'INS-001',
  categoriaId: 'cat-1',
  descripcion: null,
  unidadBase: StockUnit.UNIT,
  factorConversion: '1',
  costoPromedioPonderado: 100,
  stockMinimoBodega: 10,
  stockMaximoBodega: 50,
  aplicaVencimiento: false,
  aplicaLote: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  categoria: { id: 'cat-1', nombre: 'Test' },
  supplierProducts: [],
};

const serviceMock = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  findSuppliers: jest.fn(),
  findPriceHistory: jest.fn(),
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

      expect(result.id).toBe('item-1');
      expect(serviceMock.findOne).toHaveBeenCalledWith(tenantId, 'item-1');
    });
  });

  describe('findAll', () => {
    it('maps list response', async () => {
      serviceMock.findAll.mockResolvedValue([mockSupplyItem]);

      const result = await controller.findAll(tenantId, {});

      expect(result).toHaveLength(1);
      expect(result[0]?.codigoInterno).toBe('INS-001');
    });
  });
});
