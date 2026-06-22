import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
  stockActualBodega: '0',
  aplicaVencimiento: false,
  aplicaLote: false,
  fechaVencimiento: null,
  lote: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  categoria: {
    id: 'cat-1',
    tenantId,
    nombre: 'Test',
    prefijo: 'TST',
    descripcion: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  supplierProducts: [],
};

const repoMock = {
  findOne: jest.fn(),
  findOneDetailed: jest.fn(),
  findAll: jest.fn(),
  findByCodigoInterno: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findSuppliersForItem: jest.fn(),
  findPriceHistory: jest.fn(),
  categoryExists: jest.fn(),
  findCategoryPrefijo: jest.fn(),
  findCodigosInternosByCategory: jest.fn(),
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
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);

      const result = await service.findOne(tenantId, 'item-1');

      expect(result).toEqual(mockSupplyItem);
      expect(repoMock.findOneDetailed).toHaveBeenCalledWith(tenantId, 'item-1');
    });

    it('throws NotFoundException when item is missing', async () => {
      repoMock.findOneDetailed.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns supply items for the tenant and search criteria', async () => {
      repoMock.findAll.mockResolvedValue([mockSupplyItem]);

      const result = await service.findAll(tenantId, { search: 'insumo', limit: 10 });

      expect(result).toEqual([mockSupplyItem]);
      expect(repoMock.findAll).toHaveBeenCalledWith(tenantId, {
        search: 'insumo',
        limit: 10,
      });
    });
  });

  const createInput = {
    nombre: 'Nuevo',
    codigoInterno: 'INS-002',
    categoriaId: 'cat-1',
    unidadBase: StockUnit.UNIT,
    factorConversion: '1',
    stockMinimoBodega: '1',
    stockMaximoBodega: '10',
  };

  describe('create', () => {
    it('creates item when validations pass', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(mockSupplyItem);

      const result = await service.create(tenantId, createInput);

      expect(result).toEqual(mockSupplyItem);
      expect(repoMock.create).toHaveBeenCalled();
    });

    it('throws NotFoundException when category is missing', async () => {
      repoMock.categoryExists.mockResolvedValue(false);

      await expect(service.create(tenantId, createInput)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when codigoInterno exists', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue({ id: 'other' });

      await expect(service.create(tenantId, createInput)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when stock range is invalid', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);

      await expect(
        service.create(tenantId, {
          ...createInput,
          stockMinimoBodega: '20',
          stockMaximoBodega: '5',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when stockActualBodega is negative', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);

      await expect(
        service.create(tenantId, { ...createInput, stockActualBodega: '-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when aplicaVencimiento is true without fechaVencimiento', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);

      await expect(
        service.create(tenantId, { ...createInput, aplicaVencimiento: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('persists tracking fields when aplicaVencimiento and aplicaLote are enabled', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(mockSupplyItem);

      await service.create(tenantId, {
        ...createInput,
        aplicaVencimiento: true,
        aplicaLote: true,
        fechaVencimiento: '2026-12-31',
        lote: 'LOTE-0001',
      });

      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          fechaVencimiento: expect.any(Date),
          lote: 'LOTE-0001',
        }),
      );
    });

    it('accepts BOX as unidadBase', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.create.mockResolvedValue({ ...mockSupplyItem, unidadBase: StockUnit.BOX });

      await service.create(tenantId, { ...createInput, unidadBase: StockUnit.BOX });

      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ unidadBase: StockUnit.BOX }),
      );
    });

    it('throws ConflictException on prisma unique violation', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.create(tenantId, createInput)).rejects.toThrow(ConflictException);
    });

    it('auto-generates codigoInterno when omitted', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findCategoryPrefijo.mockResolvedValue('TST');
      repoMock.findCodigosInternosByCategory.mockResolvedValue(['TST-000001', 'TST-000003']);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(mockSupplyItem);

      const { codigoInterno: _codigo, ...withoutCodigo } = createInput;
      await service.create(tenantId, withoutCodigo);

      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ codigoInterno: 'TST-000004' }),
      );
    });
  });

  describe('getNextCodigoInterno', () => {
    it('returns first sequential code when category has no matching items', async () => {
      repoMock.findCategoryPrefijo.mockResolvedValue('ACF');
      repoMock.findCodigosInternosByCategory.mockResolvedValue(['LEGACY-001']);

      await expect(service.getNextCodigoInterno(tenantId, 'cat-1')).resolves.toBe('ACF-000001');
    });

    it('throws NotFoundException when category is missing', async () => {
      repoMock.findCategoryPrefijo.mockResolvedValue(null);

      await expect(service.getNextCodigoInterno(tenantId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns next code after highest sequential match', async () => {
      repoMock.findCategoryPrefijo.mockResolvedValue('ACF');
      repoMock.findCodigosInternosByCategory.mockResolvedValue(['ACF-000010', 'ACF-000042']);

      await expect(service.getNextCodigoInterno(tenantId, 'cat-1')).resolves.toBe('ACF-000043');
    });

    it('throws BadRequestException when sequence is exhausted', async () => {
      repoMock.findCategoryPrefijo.mockResolvedValue('ACF');
      repoMock.findCodigosInternosByCategory.mockResolvedValue(['ACF-999999']);

      await expect(service.getNextCodigoInterno(tenantId, 'cat-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates item when codigo stays the same', async () => {
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.update.mockResolvedValue(mockSupplyItem);

      const result = await service.update(tenantId, 'item-1', { nombre: 'Renamed' });

      expect(result).toEqual(mockSupplyItem);
      expect(repoMock.findByCodigoInterno).not.toHaveBeenCalled();
    });

    it('validates unique codigo when it changes', async () => {
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.findByCodigoInterno.mockResolvedValue({ id: 'other' });

      await expect(
        service.update(tenantId, 'item-1', { codigoInterno: 'INS-999' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deactivates item via update', async () => {
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.update.mockResolvedValue({ ...mockSupplyItem, isActive: false });

      await service.deactivate(tenantId, 'item-1');

      expect(repoMock.update).toHaveBeenCalledWith(
        tenantId,
        'item-1',
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('findSuppliers and findPriceHistory', () => {
    it('returns suppliers for existing item', async () => {
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.findSuppliersForItem.mockResolvedValue([]);

      await expect(service.findSuppliers(tenantId, 'item-1')).resolves.toEqual([]);
    });

    it('returns price history for existing item', async () => {
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.findPriceHistory.mockResolvedValue([]);

      await expect(service.findPriceHistory(tenantId, 'item-1', { limit: 5 })).resolves.toEqual([]);
    });
  });
});
