/**
 * SupplierProductService tests
 */

import { SupplierProductService } from '../../src/services/supplier-product.service';
import { ConflictError, NotFoundError, ValidationError } from '../../src/utils/errors';
import type { Supplier, SupplierProduct, SupplyItem } from '@prisma/client';

function makeSupplyItem(overrides: Partial<SupplyItem> = {}): SupplyItem {
  return {
    id: 'si-1',
    tenantId: 'tenant-abc',
    nombre: 'Tomate',
    codigoInterno: 'TOM-001',
    categoriaId: 'cat-1',
    descripcion: null,
    unidadBase: 'KILOGRAMS',
    factorConversion: 1 as unknown as SupplyItem['factorConversion'],
    costoPromedioPonderado: 1000 as unknown as SupplyItem['costoPromedioPonderado'],
    stockMinimoBodega: 0 as unknown as SupplyItem['stockMinimoBodega'],
    stockMaximoBodega: 100 as unknown as SupplyItem['stockMaximoBodega'],
    aplicaVencimiento: false,
    aplicaLote: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSupplierProduct(overrides: Partial<SupplierProduct> = {}): SupplierProduct {
  return {
    id: 'sp-1',
    tenantId: 'tenant-abc',
    supplierId: 'sup-1',
    supplyItemId: 'si-1',
    precioUnitario: 5000 as unknown as SupplierProduct['precioUnitario'],
    unidadCompra: 'KILOGRAMS',
    factorConversion: 5 as unknown as SupplierProduct['factorConversion'],
    tiempoEntregaDias: 2,
    esProveedorPrincipal: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeService() {
  const supplier: Supplier = {
    id: 'sup-1',
    tenantId: 'tenant-abc',
    razonSocial: 'Acme',
    nit: '900',
    dv: null,
    tipo: 'PERSONA_JURIDICA',
    direccion: null,
    ciudad: null,
    telefono: null,
    email: null,
    contactoNombre: null,
    condicionPago: 'CONTADO',
    cupoCredito: 0,
    calificacion: 3 as unknown as Supplier['calificacion'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const product = makeSupplierProduct();
  const supplyItem = makeSupplyItem();

  const prismaClient = {
    supplier: {
      findFirst: jest.fn().mockResolvedValue(supplier),
    },
    supplyItem: {
      findFirst: jest.fn().mockResolvedValue(supplyItem),
    },
    supplierProduct: {
      findMany: jest.fn().mockResolvedValue([{ ...product, supplyItem }]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(product),
      create: jest.fn().mockResolvedValue({ ...product, supplyItem }),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplyItemPriceHistory: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const prisma = {
    ...prismaClient,
    $transaction: jest.fn(async (fn: (tx: typeof prismaClient) => Promise<unknown>) =>
      fn(prismaClient),
    ),
  };

  const redis = {} as never;
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as never;
  return { service: new SupplierProductService(prisma as never, redis, log), prisma };
}

describe('SupplierProductService', () => {
  it('findBySupplierId returns products with supply item', async () => {
    const { service } = makeService();
    const rows = await service.findBySupplierId('tenant-abc', 'sup-1');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.supplyItem.nombre).toBe('Tomate');
  });

  it('create links a new product when not duplicated', async () => {
    const { service, prisma } = makeService();
    const created = await service.create('tenant-abc', {
      supplierId: 'sup-1',
      supplyItemId: 'si-1',
      precioUnitario: 4500,
      unidadCompra: 'KILOGRAMS',
      factorConversion: 5,
      tiempoEntregaDias: 1,
      esProveedorPrincipal: false,
    });
    expect(created.id).toBe('sp-1');
    expect(prisma.supplierProduct.create).toHaveBeenCalled();
  });

  it('create throws ConflictError when link already exists', async () => {
    const { service, prisma } = makeService();
    prisma.supplierProduct.findUnique.mockResolvedValue(makeSupplierProduct());
    await expect(
      service.create('tenant-abc', {
        supplierId: 'sup-1',
        supplyItemId: 'si-1',
        precioUnitario: 4500,
        unidadCompra: 'KILOGRAMS',
        factorConversion: 5,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('update throws ValidationError for non-positive price', async () => {
    const { service } = makeService();
    await expect(service.update('sp-1', 'tenant-abc', { precioUnitario: 0 })).rejects.toThrow(
      ValidationError,
    );
  });

  it('update records price history when precioUnitario changes', async () => {
    const { service, prisma } = makeService();
    const supplyItem = makeSupplyItem();
    prisma.supplierProduct.update.mockResolvedValue({
      ...makeSupplierProduct({ precioUnitario: 6000 as never }),
      supplyItem,
    });

    await service.update('sp-1', 'tenant-abc', { precioUnitario: 6000 });

    expect(prisma.supplyItemPriceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          costoNuevo: 6000,
          referenciaTipo: 'SupplierProduct',
        }),
      }),
    );
  });

  it('delete removes product link', async () => {
    const { service, prisma } = makeService();
    const result = await service.delete('sp-1', 'tenant-abc');
    expect(result).toBe(true);
    expect(prisma.supplierProduct.delete).toHaveBeenCalled();
  });

  it('throws NotFoundError when product missing', async () => {
    const { service, prisma } = makeService();
    prisma.supplierProduct.findFirst.mockResolvedValue(null);
    await expect(service.delete('missing', 'tenant-abc')).rejects.toThrow(NotFoundError);
  });
});
