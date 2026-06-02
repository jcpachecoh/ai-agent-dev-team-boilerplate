import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StockUnit } from '@prisma/client';
import { SupplyItemsService } from '../service/supplyitems.service';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';

const tenantId = 'palos-de-lena';
const mockSupplyItem = {
  id: 'item-1',
  tenantId,
  nombre: 'Insumo Test',
  codigoInterno: 'INS-001',
  categoriaId: 'cat-1',
  descripcion: null,
  unidadBase: StockUnit.UNIT,
  factorConversion: '1.0',
  costoPromedioPonderado: '100.0',
  stockMinimoBodega: '10.0',
  stockMaximoBodega: '50.0',
  aplicaVencimiento: false,
  aplicaLote: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findOne: jest.fn(),
};

describe('SupplyItemsService', () => {
  let service: SupplyItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyItemsService, { provide: SupplyItemsRepository, useValue: repoMock }],
    }).compile();

    service = module.get<SupplyItemsService>(SupplyItemsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('returns the supply item when found for tenant', async () => {
      repoMock.findOne.mockResolvedValue(mockSupplyItem);

      const result = await service.findOne(tenantId, 'item-1');

      expect(result).toEqual(mockSupplyItem);
      expect(repoMock.findOne).toHaveBeenCalledWith(tenantId, 'item-1');
    });

    it('throws NotFoundException when item is missing', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
