import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplierProductRepository } from '../repository/supplier-product.repository';

const tenantId = 'tenant-1';
const product = {
  id: 'sp-1',
  tenantId,
  supplierId: 'sup-1',
  supplyItemId: 'item-1',
  precioUnitario: 10,
  unidadCompra: 'UNIT',
  factorConversion: 1,
  tiempoEntregaDias: 1,
  esProveedorPrincipal: false,
  supplyItem: { id: 'item-1', nombre: 'Item' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  supplierProduct: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  supplyItemPriceHistory: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  supplier: { findFirst: jest.fn() },
  supplyItem: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

describe('SupplierProductRepository', () => {
  let repository: SupplierProductRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierProductRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    repository = module.get(SupplierProductRepository);
  });

  it('loads products and checks related entities', async () => {
    prismaMock.supplierProduct.findMany.mockResolvedValue([product]);
    prismaMock.supplierProduct.findFirst.mockResolvedValue(product);
    prismaMock.supplierProduct.findUnique.mockResolvedValue(product);
    prismaMock.supplier.findFirst.mockResolvedValue({ id: 'sup-1' });
    prismaMock.supplyItem.findFirst.mockResolvedValue({ id: 'item-1' });

    await expect(repository.findBySupplierId(tenantId, 'sup-1')).resolves.toEqual([product]);
    await expect(repository.findById('sp-1', tenantId)).resolves.toEqual(product);
    await expect(repository.findExisting(tenantId, 'sup-1', 'item-1')).resolves.toEqual(product);
    await expect(repository.assertSupplierExists(tenantId, 'sup-1')).resolves.toBe(true);
    await expect(repository.assertSupplyItemExists(tenantId, 'item-1')).resolves.toBe(true);
  });

  it('creates, updates, deletes, and reads price history', async () => {
    prismaMock.supplierProduct.create.mockResolvedValue(product);
    prismaMock.supplierProduct.update.mockResolvedValue(product);
    prismaMock.supplyItemPriceHistory.findFirst.mockResolvedValue({ costoAnterior: 8 });
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => unknown) =>
      cb({
        supplierProduct: prismaMock.supplierProduct,
        supplyItemPriceHistory: prismaMock.supplyItemPriceHistory,
      } as never),
    );

    await expect(
      repository.create(tenantId, {
        supplierId: 'sup-1',
        supplyItemId: 'item-1',
        precioUnitario: 10,
        unidadCompra: 'UNIT',
        factorConversion: 1,
      }),
    ).resolves.toEqual(product);
    await expect(
      repository.updateWithPriceHistory('sp-1', tenantId, product as never, { precioUnitario: 12 }),
    ).resolves.toEqual(product);
    await expect(repository.update('sp-1', { tiempoEntregaDias: 2 })).resolves.toEqual(product);
    await repository.delete('sp-1');
    await expect(repository.getPreviousPrice(tenantId, 'item-1')).resolves.toBe(8);
  });
});
