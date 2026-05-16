import { Test, TestingModule } from '@nestjs/testing';
import { SupplyItemsController } from '../controller/supplyitems.controller';
import { SupplyItemsService } from '../service/supplyitems.service';
import { StockUnit } from '@prisma/client';

const tenantId = 'tenant-123';
const mockSupplyItem = {
  id: 'item-1',
  nombre: 'Insumo Test',
  codigoInterno: 'INS-001',
  tenantId,
};

const serviceMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findSuppliers: jest.fn(),
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

  describe('create', () => {
    it('should call service with tenantId from context and dto from body', async () => {
      const dto = {
        nombre: 'Insumo Test',
        codigoInterno: 'INS-001',
        categoriaId: 'cat-1',
        unidadBase: StockUnit.UNIT,
        factorConversion: '1.0',
        costoPromedioPonderado: '0',
        stockMinimoBodega: '0',
        stockMaximoBodega: '0',
        aplicaVencimiento: false,
        aplicaLote: false,
      };

      serviceMock.create.mockResolvedValue(mockSupplyItem);

      // Simulating request with tenantId already resolved (e.g. by interceptor/guard)
      // In NestJS, this is often passed via @Req() or a custom decorator
      // For unit test, we call the controller method directly.
      const result = await (controller as any).create(dto, tenantId);

      expect(result).toEqual(mockSupplyItem);
      expect(serviceMock.create).toHaveBeenCalledWith(tenantId, dto);
    });
  });

  describe('findAll', () => {
    it('should call service with tenantId', async () => {
      serviceMock.findAll.mockResolvedValue([mockSupplyItem]);

      const result = await (controller as any).findAll(tenantId);

      expect(result).toEqual([mockSupplyItem]);
      expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('findOne', () => {
    it('should call service with tenantId and id', async () => {
      serviceMock.findOne.mockResolvedValue(mockSupplyItem);

      const result = await (controller as any).findOne('item-1', tenantId);

      expect(result).toEqual(mockSupplyItem);
      expect(serviceMock.findOne).toHaveBeenCalledWith(tenantId, 'item-1');
    });
  });

  describe('findSuppliers', () => {
    it('should call service with tenantId and id', async () => {
      const mockSuppliers = [{ supplierId: 'supp-1', razonSocial: 'Alpha' }];
      serviceMock.findSuppliers.mockResolvedValue(mockSuppliers);

      const result = await controller.findSuppliers('item-1', tenantId);

      expect(result).toEqual(mockSuppliers);
      expect(serviceMock.findSuppliers).toHaveBeenCalledWith(tenantId, 'item-1');
    });
  });
});
