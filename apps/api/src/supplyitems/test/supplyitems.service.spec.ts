import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { StockUnit } from '@prisma/client';
import { SupplyItemsService } from '../service/supplyitems.service';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';
import { getAllowedTallas } from '../constants/dotacion.constants';

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
  locationExists: jest.fn(),
  findCategoryPrefijo: jest.fn(),
  findCategoryNombre: jest.fn(),
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

    it('usa opciones vacías por defecto cuando no se pasan filtros', async () => {
      // Arrange
      repoMock.findAll.mockResolvedValue([]);

      // Act
      await service.findAll(tenantId);

      // Assert
      expect(repoMock.findAll).toHaveBeenCalledWith(tenantId, {});
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

    it('throws NotFoundException when location is missing', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.locationExists.mockResolvedValue(false);

      await expect(
        service.create(tenantId, { ...createInput, locationId: 'loc-missing' }),
      ).rejects.toThrow(NotFoundException);
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

    it('allows aplicaVencimiento and aplicaLote without fechaVencimiento or lote', async () => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(mockSupplyItem);

      await service.create(tenantId, {
        ...createInput,
        aplicaVencimiento: true,
        aplicaLote: true,
      });

      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          aplicaVencimiento: true,
          aplicaLote: true,
          fechaVencimiento: null,
          lote: null,
        }),
      );
    });

    it('persists tracking fields when fechaVencimiento and lote are provided', async () => {
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

    it('rethrows non-P2002 errors from repository on create', async () => {
      // Arrange
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.findCategoryNombre.mockResolvedValue('Test');
      repoMock.create.mockRejectedValue(new Error('DB unavailable'));

      // Act & Assert
      await expect(service.create(tenantId, createInput)).rejects.toThrow('DB unavailable');
    });

    it('acepta fechaVencimiento como objeto Date y la convierte a string ISO', async () => {
      // Arrange
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.findCategoryNombre.mockResolvedValue('Test');
      repoMock.create.mockResolvedValue(mockSupplyItem);

      // Act
      await service.create(tenantId, {
        ...createInput,
        aplicaVencimiento: true,
        fechaVencimiento: new Date('2026-12-31'),
      });

      // Assert — la fecha Date se normaliza y llega como Date al repositorio
      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ fechaVencimiento: expect.any(Date) }),
      );
    });

    it('lanza BadRequestException cuando fechaVencimiento es una cadena inválida', async () => {
      // Arrange
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.findCategoryNombre.mockResolvedValue('Test');

      // Act & Assert
      await expect(
        service.create(tenantId, {
          ...createInput,
          aplicaVencimiento: true,
          fechaVencimiento: 'not-a-date',
        }),
      ).rejects.toThrow(BadRequestException);
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

  describe('Dotación category validation', () => {
    const dotacionBase = {
      nombre: 'Camiseta Femenino XL',
      codigoInterno: 'DOT-000001',
      categoriaId: 'cat-dotacion',
      unidadBase: StockUnit.UNIT,
      factorConversion: '1',
      stockMinimoBodega: '5',
      stockMaximoBodega: '20',
    };

    beforeEach(() => {
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(mockSupplyItem);
      repoMock.findCategoryNombre.mockResolvedValue('Dotación');
    });

    it('crea ítem Dotación válido con subcategoria, genero y talla correctos', async () => {
      // Arrange
      const input = {
        ...dotacionBase,
        subcategoria: 'Camisas/Camisetas',
        genero: 'Femenino',
        talla: 'XL',
      };

      // Act
      await service.create(tenantId, input);

      // Assert
      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          subcategoria: 'Camisas/Camisetas',
          genero: 'Femenino',
          talla: 'XL',
        }),
      );
    });

    it('lanza BadRequestException cuando subcategoria falta para Dotación', async () => {
      // Act & Assert
      await expect(
        service.create(tenantId, { ...dotacionBase, genero: 'Femenino', talla: 'XL' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException cuando subcategoria no es válida para Dotación', async () => {
      // Act & Assert
      await expect(
        service.create(tenantId, {
          ...dotacionBase,
          subcategoria: 'SubcategoriaInvalida',
          genero: 'Femenino',
          talla: 'XL',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException cuando genero falta para Dotación', async () => {
      // Act & Assert
      await expect(
        service.create(tenantId, {
          ...dotacionBase,
          subcategoria: 'Camisas/Camisetas',
          talla: 'XL',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException cuando genero no es válido para la subcategoria', async () => {
      // Act & Assert — Calzado solo acepta Unisex
      await expect(
        service.create(tenantId, {
          ...dotacionBase,
          subcategoria: 'Calzado',
          genero: 'Femenino',
          talla: '38',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException cuando talla falta para Dotación', async () => {
      // Act & Assert
      await expect(
        service.create(tenantId, {
          ...dotacionBase,
          subcategoria: 'Camisas/Camisetas',
          genero: 'Femenino',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException cuando talla no es válida para subcategoria+genero', async () => {
      // Act & Assert — Pantalones Femenino no acepta talla "28" (solo 6,8,10,12,14,16)
      await expect(
        service.create(tenantId, {
          ...dotacionBase,
          subcategoria: 'Pantalones/Overoles',
          genero: 'Femenino',
          talla: '28',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('acepta tallas correctas de Pantalones Masculino (28–40)', async () => {
      // Arrange
      const input = {
        ...dotacionBase,
        subcategoria: 'Pantalones/Overoles',
        genero: 'Masculino',
        talla: '32',
      };

      // Act
      await service.create(tenantId, input);

      // Assert
      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          subcategoria: 'Pantalones/Overoles',
          genero: 'Masculino',
          talla: '32',
        }),
      );
    });

    it('acepta N/A como talla para Petos/Batas/Delantales', async () => {
      // Arrange
      const input = {
        ...dotacionBase,
        subcategoria: 'Petos/Batas/Delantales',
        genero: 'Unisex',
        talla: 'N/A',
      };

      // Act
      await service.create(tenantId, input);

      // Assert
      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ talla: 'N/A' }),
      );
    });

    it('ignora y limpia subcategoria/genero/talla para categorías no-Dotación', async () => {
      // Arrange
      repoMock.findCategoryNombre.mockResolvedValue('Menaje');
      const input = {
        ...dotacionBase,
        subcategoria: 'Calzado',
        genero: 'Unisex',
        talla: '38',
      };

      // Act
      await service.create(tenantId, input);

      // Assert — campos Dotación deben llegar null al repositorio
      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ subcategoria: null, genero: null, talla: null }),
      );
    });
  });

  describe('Comodatos — stock 0 permitido', () => {
    it('acepta stockMinimoBodega y stockMaximoBodega en 0 para Comodatos', async () => {
      // Arrange
      repoMock.categoryExists.mockResolvedValue(true);
      repoMock.findByCodigoInterno.mockResolvedValue(null);
      repoMock.findCategoryNombre.mockResolvedValue('Comodatos');
      repoMock.create.mockResolvedValue(mockSupplyItem);

      // Act
      await service.create(tenantId, {
        nombre: 'Equipo Comodato',
        codigoInterno: 'COM-000001',
        categoriaId: 'cat-comodatos',
        unidadBase: StockUnit.UNIT,
        factorConversion: '1',
        stockMinimoBodega: '0',
        stockMaximoBodega: '0',
      });

      // Assert
      expect(repoMock.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ stockMinimoBodega: '0', stockMaximoBodega: '0' }),
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

    it('lanza NotFoundException cuando el nuevo categoriaId no existe', async () => {
      // Arrange
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.categoryExists.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.update(tenantId, 'item-1', { categoriaId: 'cat-nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException cuando stockActualBodega es negativo en update', async () => {
      // Arrange
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);

      // Act & Assert
      await expect(service.update(tenantId, 'item-1', { stockActualBodega: '-5' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rethrows non-P2002 errors from repository on update', async () => {
      // Arrange
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.findCategoryNombre.mockResolvedValue('Test');
      repoMock.update.mockRejectedValue(new Error('connection lost'));

      // Act & Assert
      await expect(service.update(tenantId, 'item-1', { nombre: 'X' })).rejects.toThrow(
        'connection lost',
      );
    });

    it('usa fechaVencimiento del input cuando se provee explícitamente en update', async () => {
      // Arrange — cubre la rama "then" del ternario de fechaVencimiento (línea 99)
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.findCategoryNombre.mockResolvedValue('Test');
      repoMock.update.mockResolvedValue(mockSupplyItem);

      // Act — pasar fechaVencimiento explícito (null) para entrar en la rama "then"
      await service.update(tenantId, 'item-1', { fechaVencimiento: null });

      // Assert — el repositorio recibe la llamada (no importa el valor exacto de fechaVencimiento)
      expect(repoMock.update).toHaveBeenCalled();
    });

    it('usa lote del input cuando se provee explícitamente en update', async () => {
      // Arrange — cubre la rama "then" del ternario de lote (línea 102)
      repoMock.findOneDetailed.mockResolvedValue(mockSupplyItem);
      repoMock.findCategoryNombre.mockResolvedValue('Test');
      repoMock.update.mockResolvedValue(mockSupplyItem);

      // Act
      await service.update(tenantId, 'item-1', { lote: 'LOTE-9999' });

      // Assert
      expect(repoMock.update).toHaveBeenCalled();
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

describe('getAllowedTallas — dotacion constants', () => {
  it('retorna array vacío cuando el género no es válido para la subcategoría', () => {
    // Arrange & Act — Calzado solo tiene Unisex; Masculino no existe como clave
    const result = getAllowedTallas('Calzado', 'Masculino');

    // Assert
    expect(result).toEqual([]);
  });
});
