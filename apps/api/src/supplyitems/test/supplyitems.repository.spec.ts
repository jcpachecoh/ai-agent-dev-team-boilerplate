import { Test, TestingModule } from '@nestjs/testing';
import { StockUnit } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';

const tenantId = 'tenant-1';
const item = {
  id: 'item-1',
  tenantId,
  nombre: 'Tomato',
  codigoInterno: 'TOM-1',
  categoriaId: 'cat-1',
  unidadBase: StockUnit.KILOGRAMS,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  supplyItem: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  supplierProduct: {
    findMany: jest.fn(),
  },
  supplyItemPriceHistory: {
    findMany: jest.fn(),
  },
  supplyCategory: {
    findFirst: jest.fn(),
  },
};

describe('SupplyItemsRepository', () => {
  let repository: SupplyItemsRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyItemsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    repository = module.get(SupplyItemsRepository);
  });

  it('finds one supply item scoped by tenant', async () => {
    prismaMock.supplyItem.findFirst.mockResolvedValue(item);

    await expect(repository.findOne(tenantId, 'item-1')).resolves.toEqual(item);
  });

  it('findOneDetailed includes relations', async () => {
    prismaMock.supplyItem.findFirst.mockResolvedValue(item);

    await repository.findOneDetailed(tenantId, 'item-1');

    expect(prismaMock.supplyItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'item-1', tenantId }, include: expect.any(Object) }),
    );
  });

  it('findAll applies search, filters, and clamps pagination', async () => {
    prismaMock.supplyItem.findMany.mockResolvedValue([item]);

    await repository.findAll(tenantId, {
      search: 'tom',
      limit: 200,
      offset: -1,
      isActive: false,
      categoriaId: 'cat-1',
      codigoInterno: 'TOM-1',
    });

    expect(prismaMock.supplyItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          isActive: false,
          categoriaId: 'cat-1',
          codigoInterno: { equals: 'TOM-1', mode: 'insensitive' },
          OR: expect.any(Array),
        }),
        take: 100,
        skip: 0,
      }),
    );
  });

  it('findByCodigoInterno is case-insensitive', async () => {
    prismaMock.supplyItem.findFirst.mockResolvedValue(item);

    await repository.findByCodigoInterno(tenantId, 'tom-1');

    expect(prismaMock.supplyItem.findFirst).toHaveBeenCalledWith({
      where: { tenantId, codigoInterno: { equals: 'tom-1', mode: 'insensitive' } },
    });
  });

  it('create persists item with defaults', async () => {
    prismaMock.supplyItem.create.mockResolvedValue(item);

    await repository.create(tenantId, {
      nombre: 'Tomato',
      codigoInterno: 'TOM-1',
      categoriaId: 'cat-1',
      unidadBase: StockUnit.KILOGRAMS,
      factorConversion: '1',
      stockMinimoBodega: '1',
      stockMaximoBodega: '10',
    });

    expect(prismaMock.supplyItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          costoPromedioPonderado: '0',
          aplicaVencimiento: false,
          isActive: true,
        }),
      }),
    );
  });

  it('update patches only provided fields', async () => {
    prismaMock.supplyItem.update.mockResolvedValue(item);

    await repository.update(tenantId, 'item-1', { nombre: 'Nuevo', isActive: false });

    expect(prismaMock.supplyItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { nombre: 'Nuevo', isActive: false },
      include: expect.any(Object),
    });
  });

  it('findSuppliersForItem maps supplier rows', async () => {
    prismaMock.supplierProduct.findMany.mockResolvedValue([
      {
        supplierId: 'sup-1',
        supplier: { razonSocial: 'ACME', nit: '900' },
        precioUnitario: '10.5',
        unidadCompra: StockUnit.KILOGRAMS,
        factorConversion: '1',
        tiempoEntregaDias: 3,
        esProveedorPrincipal: true,
      },
    ]);

    const rows = await repository.findSuppliersForItem(tenantId, 'item-1');

    expect(rows[0]).toEqual(
      expect.objectContaining({
        razonSocial: 'ACME',
        precioUnitario: 10.5,
        esProveedorPrincipal: true,
      }),
    );
  });

  it('findPriceHistory clamps pagination', async () => {
    prismaMock.supplyItemPriceHistory.findMany.mockResolvedValue([]);

    await repository.findPriceHistory(tenantId, 'item-1', { limit: 500, offset: -2 });

    expect(prismaMock.supplyItemPriceHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100, skip: 0 }),
    );
  });

  it('categoryExists returns true when category is found', async () => {
    prismaMock.supplyCategory.findFirst.mockResolvedValue({ id: 'cat-1' });

    await expect(repository.categoryExists(tenantId, 'cat-1')).resolves.toBe(true);
  });

  it('categoryExists returns false when category is missing', async () => {
    prismaMock.supplyCategory.findFirst.mockResolvedValue(null);

    await expect(repository.categoryExists(tenantId, 'missing')).resolves.toBe(false);
  });
});
