import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SupplierProductService } from '../service/supplier-product.service';
import { SupplierProductRepository } from '../repository/supplier-product.repository';
import type { SupplierProduct, SupplyItem } from '@prisma/client';

const mockSupplyItem: SupplyItem = {
  id: 'item-1',
  tenantId: 'tenant-1',
  nombre: 'Harina',
  codigoInterno: 'HAR-001',
  categoriaId: 'cat-1',
  descripcion: null,
  unidadBase: 'KILOGRAMS' as any,
  factorConversion: 1 as any,
  costoPromedioPonderado: 0 as any,
  stockMinimoBodega: 0 as any,
  stockMaximoBodega: 100 as any,
  aplicaVencimiento: false,
  aplicaLote: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProduct = {
  id: 'prod-1',
  tenantId: 'tenant-1',
  supplierId: 'sup-1',
  supplyItemId: 'item-1',
  precioUnitario: 100 as any,
  unidadCompra: 'KILOGRAMS' as any,
  factorConversion: 1 as any,
  tiempoEntregaDias: 1,
  esProveedorPrincipal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  supplyItem: mockSupplyItem,
};

describe('SupplierProductService', () => {
  let service: SupplierProductService;
  let repository: jest.Mocked<SupplierProductRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierProductService,
        {
          provide: SupplierProductRepository,
          useValue: {
            findBySupplierId: jest.fn(),
            findById: jest.fn(),
            findExisting: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateWithPriceHistory: jest.fn(),
            delete: jest.fn(),
            getPreviousPrice: jest.fn(),
            assertSupplierExists: jest.fn(),
            assertSupplyItemExists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SupplierProductService>(SupplierProductService);
    repository = module.get(SupplierProductRepository);
  });

  afterEach(() => jest.resetAllMocks());

  describe('findBySupplierId', () => {
    it('returns products when supplier exists', async () => {
      repository.assertSupplierExists.mockResolvedValue(true);
      repository.findBySupplierId.mockResolvedValue([mockProduct]);
      const result = await service.findBySupplierId('tenant-1', 'sup-1');
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when supplier not found', async () => {
      repository.assertSupplierExists.mockResolvedValue(false);
      await expect(service.findBySupplierId('tenant-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deletes and returns true', async () => {
      repository.findById.mockResolvedValue(mockProduct);
      repository.delete.mockResolvedValue(undefined);
      const result = await service.delete('prod-1', 'tenant-1');
      expect(result).toBe(true);
    });

    it('throws NotFoundException for missing product', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.delete('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
