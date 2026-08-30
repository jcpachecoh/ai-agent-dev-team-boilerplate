import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupplierProductService } from '../service/supplier-product.service';
import { SupplierProductRepository } from '../repository/supplier-product.repository';

const tenantId = 'tenant-1';
const mockSupplierProduct = {
  id: 'sp-1',
  tenantId,
  supplierId: 'sup-1',
  supplyItemId: 'item-1',
  precioUnitario: 12.5,
  unidadCompra: 'UNIT',
  factorConversion: 1,
  tiempoEntregaDias: 1,
  esProveedorPrincipal: false,
  supplyItem: {
    id: 'item-1',
    tenantId,
    nombre: 'Item 1',
    codigoInterno: 'IT-1',
    unidadBase: 'UNIT',
    isActive: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findBySupplierId: jest.fn(),
  findById: jest.fn(),
  findExisting: jest.fn(),
  create: jest.fn(),
  updateWithPriceHistory: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getPreviousPrice: jest.fn(),
  assertSupplierExists: jest.fn(),
  assertSupplyItemExists: jest.fn(),
};

describe('SupplierProductService', () => {
  let service: SupplierProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierProductService,
        { provide: SupplierProductRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get<SupplierProductService>(SupplierProductService);
    jest.clearAllMocks();
  });

  it('returns products for supplier', async () => {
    repoMock.assertSupplierExists.mockResolvedValue(true);
    repoMock.findBySupplierId.mockResolvedValue([mockSupplierProduct]);

    await expect(service.findBySupplierId(tenantId, 'sup-1')).resolves.toEqual([
      mockSupplierProduct,
    ]);
  });

  it('throws when supplier does not exist', async () => {
    repoMock.assertSupplierExists.mockResolvedValue(false);

    await expect(service.findBySupplierId(tenantId, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('throws conflict when product already exists', async () => {
    repoMock.assertSupplierExists.mockResolvedValue(true);
    repoMock.assertSupplyItemExists.mockResolvedValue(true);
    repoMock.findExisting.mockResolvedValue(mockSupplierProduct);

    await expect(
      service.create(tenantId, {
        supplierId: 'sup-1',
        supplyItemId: 'item-1',
        precioUnitario: 12.5,
        unidadCompra: 'UNIT',
        factorConversion: 1,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a supplier product when valid', async () => {
    repoMock.assertSupplierExists.mockResolvedValue(true);
    repoMock.assertSupplyItemExists.mockResolvedValue(true);
    repoMock.findExisting.mockResolvedValue(null);
    repoMock.create.mockResolvedValue(mockSupplierProduct);

    await expect(
      service.create(tenantId, {
        supplierId: 'sup-1',
        supplyItemId: 'item-1',
        precioUnitario: 12.5,
        unidadCompra: 'UNIT',
        factorConversion: 1,
      }),
    ).resolves.toEqual(mockSupplierProduct);
  });

  it('accepts BOX as unidadCompra', async () => {
    repoMock.assertSupplierExists.mockResolvedValue(true);
    repoMock.assertSupplyItemExists.mockResolvedValue(true);
    repoMock.findExisting.mockResolvedValue(null);
    repoMock.create.mockResolvedValue(mockSupplierProduct);

    await service.create(tenantId, {
      supplierId: 'sup-1',
      supplyItemId: 'item-1',
      precioUnitario: 12.5,
      unidadCompra: 'BOX',
      factorConversion: 1,
    });

    expect(repoMock.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ unidadCompra: 'BOX' }),
    );
  });

  it('throws when supply item is missing', async () => {
    repoMock.assertSupplierExists.mockResolvedValue(true);
    repoMock.assertSupplyItemExists.mockResolvedValue(false);

    await expect(
      service.create(tenantId, {
        supplierId: 'sup-1',
        supplyItemId: 'missing',
        precioUnitario: 12.5,
        unidadCompra: 'UNIT',
        factorConversion: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates with price history when precio changes', async () => {
    repoMock.findById.mockResolvedValue(mockSupplierProduct);
    repoMock.updateWithPriceHistory.mockResolvedValue(mockSupplierProduct);

    await expect(service.update('sp-1', tenantId, { precioUnitario: 20 })).resolves.toEqual(
      mockSupplierProduct,
    );
  });

  it('updates without history when precio is unchanged', async () => {
    repoMock.findById.mockResolvedValue(mockSupplierProduct);
    repoMock.update.mockResolvedValue(mockSupplierProduct);

    await expect(service.update('sp-1', tenantId, { tiempoEntregaDias: 3 })).resolves.toEqual(
      mockSupplierProduct,
    );
  });

  it('deletes an existing supplier product', async () => {
    repoMock.findById.mockResolvedValue(mockSupplierProduct);
    repoMock.delete.mockResolvedValue(undefined);

    await expect(service.delete('sp-1', tenantId)).resolves.toBe(true);
  });

  it('returns previous price from repository', async () => {
    repoMock.getPreviousPrice.mockResolvedValue(9.5);

    await expect(service.getPreviousPrice(tenantId, 'item-1')).resolves.toBe(9.5);
  });
});
