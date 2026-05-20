import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StockUnit } from '@prisma/client';
import { SupplyItemsService } from '../service/supplyitems.service';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';
import { LockService } from '../../lock/service/lock.service';
import { CreateSupplyItemDto } from '../controller/dto/create-supplyitem.dto';

const tenantId = 'tenant-123';
const mockSupplyItem = {
  id: 'item-1',
  tenantId,
  nombre: 'Insumo Test',
  codigoInterno: 'INS-001',
  categoriaId: 'cat-1',
  descripcion: 'Desc',
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
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCodigo: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findSuppliers: jest.fn(),
  findPriceHistory: jest.fn(),
  updateCppWithHistory: jest.fn(),
  findCategoryById: jest.fn(),
};

const lockServiceMock = {
  usingLock: jest.fn((key, ttl, cb) => cb()),
};

describe('SupplyItemsService', () => {
  let service: SupplyItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyItemsService,
        { provide: SupplyItemsRepository, useValue: repoMock },
        { provide: LockService, useValue: lockServiceMock },
      ],
    }).compile();

    service = module.get<SupplyItemsService>(SupplyItemsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateSupplyItemDto = {
      nombre: 'Insumo Test',
      codigoInterno: 'INS-001',
      categoriaId: 'cat-1',
      unidadBase: StockUnit.UNIT,
      factorConversion: '1.0',
      costoPromedioPonderado: '100.0',
      stockMinimoBodega: '10.0',
      stockMaximoBodega: '50.0',
      aplicaVencimiento: false,
      aplicaLote: false,
      isActive: true,
    };

    it('should create a supply item when data is valid and unique', async () => {
      repoMock.findByCodigo.mockResolvedValue(null);
      repoMock.findCategoryById.mockResolvedValue({ id: 'cat-1' });
      repoMock.create.mockResolvedValue(mockSupplyItem);

      const result = await service.create(tenantId, dto);

      expect(result).toEqual(mockSupplyItem);
      expect(repoMock.findByCodigo).toHaveBeenCalledWith(tenantId, dto.codigoInterno);
      expect(repoMock.findCategoryById).toHaveBeenCalledWith(tenantId, dto.categoriaId);
      expect(repoMock.create).toHaveBeenCalledWith({ ...dto, tenantId });
    });

    it('should throw ConflictException if codigoInterno already exists in tenant', async () => {
      repoMock.findByCodigo.mockResolvedValue(mockSupplyItem);

      await expect(service.create(tenantId, dto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if category does not belong to tenant', async () => {
      repoMock.findByCodigo.mockResolvedValue(null);
      repoMock.findCategoryById.mockResolvedValue(null);

      await expect(service.create(tenantId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stockMaximoBodega < stockMinimoBodega', async () => {
      const invalidDto = { ...dto, stockMinimoBodega: '100.0', stockMaximoBodega: '50.0' };

      await expect(service.create(tenantId, invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all supply items for the given tenant', async () => {
      repoMock.findAll.mockResolvedValue([mockSupplyItem]);

      const result = await service.findAll(tenantId);

      expect(result).toEqual([mockSupplyItem]);
      expect(repoMock.findAll).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('findOne', () => {
    it('should return item if found within tenant', async () => {
      repoMock.findById.mockResolvedValue(mockSupplyItem);

      const result = await service.findOne(tenantId, 'item-1');

      expect(result).toEqual(mockSupplyItem);
      expect(repoMock.findById).toHaveBeenCalledWith(tenantId, 'item-1');
    });

    it('should throw NotFoundException if item not found or belongs to another tenant', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSuppliers', () => {
    const mockSuppliersInfo = [
      {
        supplierId: 'supp-1',
        razonSocial: 'Supplier Alpha',
        nit: '12345',
        precioUnitario: '10.5',
        unidadCompra: StockUnit.UNIT,
        factorConversion: '1.0',
        tiempoEntregaDias: 3,
        esProveedorPrincipal: true,
      },
    ];

    it('should return a list of suppliers for the supply item', async () => {
      repoMock.findById.mockResolvedValue(mockSupplyItem);
      repoMock.findSuppliers.mockResolvedValue(mockSuppliersInfo);

      const result = await service.findSuppliers(tenantId, 'item-1');

      expect(result).toEqual(mockSuppliersInfo);
      expect(repoMock.findById).toHaveBeenCalledWith(tenantId, 'item-1');
      expect(repoMock.findSuppliers).toHaveBeenCalledWith(tenantId, 'item-1');
    });

    it('should throw NotFoundException if item does not exist or belongs to another tenant', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.findSuppliers(tenantId, 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPriceHistory', () => {
    const mockPriceHistory = [
      {
        id: 'hist-1',
        tenantId,
        supplyItemId: 'item-1',
        costoAnterior: '100.0',
        costoNuevo: '105.0',
        createdAt: new Date(),
      },
    ];

    it('should return price history for the supply item', async () => {
      repoMock.findById.mockResolvedValue(mockSupplyItem);
      repoMock.findPriceHistory.mockResolvedValue(mockPriceHistory);

      const result = await service.findPriceHistory(tenantId, 'item-1');

      expect(result).toEqual(mockPriceHistory);
      expect(repoMock.findById).toHaveBeenCalledWith(tenantId, 'item-1');
      expect(repoMock.findPriceHistory).toHaveBeenCalledWith(tenantId, 'item-1');
    });

    it('should throw NotFoundException if item does not exist or belongs to another tenant', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.findPriceHistory(tenantId, 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCppAtomically', () => {
    const input = {
      stockActual: '10',
      cantidadRecibida: '10',
      costoNuevo: '7',
      referenciaTipo: 'RECEPCION',
      referenciaId: 'rec-1',
      createdBy: 'user-1',
    };

    it('should acquire lock and update CPP with history', async () => {
      repoMock.findById.mockResolvedValue(mockSupplyItem);
      repoMock.updateCppWithHistory.mockResolvedValue({
        ...mockSupplyItem,
        costoPromedioPonderado: '6',
      });

      const result = await service.updateCppAtomically(tenantId, 'item-1', input);

      expect(lockServiceMock.usingLock).toHaveBeenCalledWith(
        'supply-item-cpp:tenant-123:item-1',
        5000,
        expect.any(Function),
      );
      expect(repoMock.updateCppWithHistory).toHaveBeenCalled();
      expect(result.costoPromedioPonderado).toBe('6');
    });

    it('should throw NotFoundException if item not found', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.updateCppAtomically(tenantId, 'item-1', input)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
