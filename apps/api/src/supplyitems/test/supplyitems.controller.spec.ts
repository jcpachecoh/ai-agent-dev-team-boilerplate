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

  describe('create', () => {
    it('should call service with tenantId, dto, and actorUserId', async () => {
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
      const req = { user: { sub: 'user-1' } } as never;

      const result = await controller.create(dto, tenantId, req);

      expect(result).toEqual(mockSupplyItem);
      expect(serviceMock.create).toHaveBeenCalledWith(tenantId, dto, 'user-1');
    });
  });

  describe('update', () => {
    it('should call service with tenantId, id, dto, and actorUserId', async () => {
      const dto = { nombre: 'New Name' };
      serviceMock.update.mockResolvedValue(mockSupplyItem);
      const req = { user: { sub: 'user-1' } } as never;

      const result = await controller.update('item-1', dto, tenantId, req);

      expect(result).toEqual(mockSupplyItem);
      expect(serviceMock.update).toHaveBeenCalledWith(tenantId, 'item-1', dto, 'user-1');
    });
  });

  describe('remove', () => {
    it('should call service with tenantId, id, and actorUserId', async () => {
      serviceMock.remove.mockResolvedValue(mockSupplyItem);
      const req = { user: { sub: 'user-1' } } as never;

      const result = await controller.remove('item-1', tenantId, req);

      expect(result).toEqual(mockSupplyItem);
      expect(serviceMock.remove).toHaveBeenCalledWith(tenantId, 'item-1', 'user-1');
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

  describe('findPriceHistory', () => {
    it('should call service with tenantId and id', async () => {
      const mockHistory = [{ id: 'hist-1', costoNuevo: '105.0' }];
      serviceMock.findPriceHistory.mockResolvedValue(mockHistory);

      const result = await controller.findPriceHistory('item-1', tenantId);

      expect(result).toEqual(mockHistory);
      expect(serviceMock.findPriceHistory).toHaveBeenCalledWith(tenantId, 'item-1');
    });
  });
});
