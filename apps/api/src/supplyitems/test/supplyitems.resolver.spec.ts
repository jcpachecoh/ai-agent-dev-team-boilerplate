import { BadRequestException } from '@nestjs/common';
import { StockUnit } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { SupplyItemsResolver } from '../resolver/supplyitems.resolver';
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
  costoPromedioPonderado: '100',
  stockMinimoBodega: '10',
  stockMaximoBodega: '50',
  stockActualBodega: '0',
  aplicaVencimiento: false,
  aplicaLote: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  categoria: {
    id: 'cat-1',
    tenantId,
    nombre: 'Test',
    descripcion: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  supplierProducts: [],
};

const serviceMock = {
  findAll: jest.fn(),
  create: jest.fn(),
};

describe('SupplyItemsResolver', () => {
  let resolver: SupplyItemsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyItemsResolver, { provide: SupplyItemsService, useValue: serviceMock }],
    }).compile();

    resolver = module.get<SupplyItemsResolver>(SupplyItemsResolver);
    jest.clearAllMocks();
  });

  describe('supplyItems', () => {
    it('delegates to SupplyItemsService.findAll using the tenant header', async () => {
      serviceMock.findAll.mockResolvedValue([mockSupplyItem]);

      const result = await resolver.supplyItems(
        { req: { headers: { 'x-tenant-id': tenantId } } } as never,
        'insumo',
        undefined,
        undefined,
        25,
        0,
      );

      expect(result[0]?.codigoInterno).toBe('INS-001');
      expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, {
        search: 'insumo',
        categoriaId: undefined,
        isActive: undefined,
        limit: 25,
        offset: 0,
      });
    });

    it('throws when the tenant header is missing', async () => {
      await expect(resolver.supplyItems({ req: { headers: {} } } as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('maps stockActualBodega on list items', async () => {
      serviceMock.findAll.mockResolvedValue([
        {
          ...mockSupplyItem,
          unidadBase: StockUnit.BOX,
          stockActualBodega: '12.5',
        },
      ]);

      const result = await resolver.supplyItems({
        req: { headers: { 'x-tenant-id': tenantId } },
      } as never);

      expect(result[0]?.unidadBase).toBe(StockUnit.BOX);
      expect(result[0]?.stockActualBodega).toBe(12.5);
      expect(result[0]?.stockDisponible).toBe(12.5);
    });
  });

  describe('createSupplyItem', () => {
    it('returns GraphQL type with BOX and stockActualBodega', async () => {
      serviceMock.create.mockResolvedValue({
        ...mockSupplyItem,
        unidadBase: StockUnit.BOX,
        stockActualBodega: '8',
      });

      const result = await resolver.createSupplyItem(
        { req: { headers: { 'x-tenant-id': tenantId } } } as never,
        {
          nombre: 'Caja',
          codigoInterno: 'BOX-1',
          categoriaId: 'cat-1',
          unidadBase: StockUnit.BOX,
          factorConversion: '1',
          stockMinimoBodega: '1',
          stockMaximoBodega: '10',
          stockActualBodega: '8',
        },
      );

      expect(result.unidadBase).toBe(StockUnit.BOX);
      expect(result.stockActualBodega).toBe(8);
    });
  });
});
