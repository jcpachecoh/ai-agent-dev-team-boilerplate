/**
 * DataLoaders tests
 *
 * Verifies that each DataLoader batches and maps results correctly,
 * including the null-fill for missing items.
 */

import { createDataLoaders } from '../../src/context/dataLoaders';
import type { Supplier, SupplyItem } from '@prisma/client';

function makeSupplier(id: string): Supplier {
  return {
    id,
    tenantId: 'tenant-abc',
    razonSocial: `Supplier ${id}`,
    nit: `NIT-${id}`,
    dv: null,
    tipo: 'PERSONA_JURIDICA' as Supplier['tipo'],
    direccion: null,
    ciudad: null,
    telefono: null,
    email: null,
    contactoNombre: null,
    condicionPago: 'CONTADO' as Supplier['condicionPago'],
    cupoCredito: 0,
    calificacion: 3 as unknown as Supplier['calificacion'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeSupplyItem(id: string): SupplyItem {
  return {
    id,
    tenantId: 'tenant-abc',
    supplierId: 'sup-1',
    nombre: `Item ${id}`,
    unidad: 'kg',
    precioUnitario: 100,
    moneda: 'COP',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as SupplyItem;
}

// ─── supplierLoader ──────────────────────────────────────────────────────────

describe('supplierLoader', () => {
  it('returns suppliers by id in order', async () => {
    const s1 = makeSupplier('sup-1');
    const s2 = makeSupplier('sup-2');
    const prisma = {
      supplier: {
        findMany: jest.fn().mockResolvedValue([s1, s2]),
      },
      supplyItem: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as never;

    const { supplierLoader } = createDataLoaders(prisma);
    const results = await supplierLoader.loadMany(['sup-1', 'sup-2']);
    expect(results[0]).toEqual(s1);
    expect(results[1]).toEqual(s2);
  });

  it('returns null for missing ids', async () => {
    const prisma = {
      supplier: { findMany: jest.fn().mockResolvedValue([]) },
      supplyItem: { findMany: jest.fn().mockResolvedValue([]) },
    } as never;

    const { supplierLoader } = createDataLoaders(prisma);
    const result = await supplierLoader.load('nonexistent');
    expect(result).toBeNull();
  });
});

// ─── supplyItemLoader ────────────────────────────────────────────────────────

describe('supplyItemLoader', () => {
  it('returns supply items by id in order', async () => {
    const item1 = makeSupplyItem('item-1');
    const item2 = makeSupplyItem('item-2');
    const prisma = {
      supplier: { findMany: jest.fn().mockResolvedValue([]) },
      supplyItem: { findMany: jest.fn().mockResolvedValue([item1, item2]) },
    } as never;

    const { supplyItemLoader } = createDataLoaders(prisma);
    const results = await supplyItemLoader.loadMany(['item-1', 'item-2']);
    expect(results[0]).toEqual(item1);
    expect(results[1]).toEqual(item2);
  });

  it('returns null for missing supply item ids', async () => {
    const prisma = {
      supplier: { findMany: jest.fn().mockResolvedValue([]) },
      supplyItem: { findMany: jest.fn().mockResolvedValue([]) },
    } as never;

    const { supplyItemLoader } = createDataLoaders(prisma);
    const result = await supplyItemLoader.load('no-such-item');
    expect(result).toBeNull();
  });
});
