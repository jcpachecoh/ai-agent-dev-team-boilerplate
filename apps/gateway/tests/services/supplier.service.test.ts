/**
 * SupplierService — extended tests
 *
 * Covers create, update, delete and search operations not covered by
 * the existing supplier resolver tests.
 */

import { SupplierService } from '../../src/services/supplier.service';
import { ConflictError, NotFoundError, ValidationError } from '../../src/utils/errors';
import type { Supplier } from '@prisma/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 'sup-1',
    tenantId: 'tenant-abc',
    razonSocial: 'Acme S.A.S.',
    nit: '900123456',
    dv: '1',
    tipo: 'PERSONA_JURIDICA' as Supplier['tipo'],
    direccion: 'Calle 1',
    ciudad: 'Bogotá',
    telefono: '3001234567',
    email: 'acme@example.com',
    contactoNombre: 'Juan',
    condicionPago: 'DIAS_30' as Supplier['condicionPago'],
    cupoCredito: 5000000,
    calificacion: 4.5 as unknown as Supplier['calificacion'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePrisma(overrides: Record<string, jest.Mock> = {}) {
  return {
    supplier: {
      findMany: overrides['findMany'] ?? jest.fn().mockResolvedValue([]),
      findFirst: overrides['findFirst'] ?? jest.fn().mockResolvedValue(null),
      findUnique: overrides['findUnique'] ?? jest.fn().mockResolvedValue(null),
      create: overrides['create'] ?? jest.fn(),
      update: overrides['update'] ?? jest.fn(),
    },
  };
}

function makeService(prismaOverrides: Record<string, jest.Mock> = {}) {
  const prisma = makePrisma(prismaOverrides);
  const redis = {} as never;
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as never;
  return { service: new SupplierService(prisma as never, redis, log), prisma };
}

const validInput = {
  razonSocial: 'New Supplier S.A.',
  nit: '123456789',
  tipo: 'PERSONA_JURIDICA' as const,
  condicionPago: 'CONTADO' as const,
};

// ─── create ──────────────────────────────────────────────────────────────────

describe('SupplierService.create', () => {
  it('creates a supplier when NIT does not exist yet', async () => {
    const created = makeSupplier({ id: 'sup-new', nit: '123456789' });
    const { service, prisma } = makeService({
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
    });

    const result = await service.create('tenant-abc', validInput);
    expect(result.id).toBe('sup-new');
    expect(prisma.supplier.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nit: '123456789' }) }),
    );
  });

  it('throws ConflictError when NIT already exists for tenant', async () => {
    const existing = makeSupplier();
    const { service } = makeService({
      findUnique: jest.fn().mockResolvedValue(existing),
    });

    await expect(service.create('tenant-abc', validInput)).rejects.toThrow(ConflictError);
  });

  it('throws ValidationError for invalid input (missing razonSocial)', async () => {
    const { service } = makeService();
    await expect(
      service.create('tenant-abc', {
        nit: '123',
        tipo: 'PERSONA_JURIDICA',
        condicionPago: 'CONTADO',
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('SupplierService.update', () => {
  it('updates supplier fields', async () => {
    const existing = makeSupplier();
    const updated = makeSupplier({ razonSocial: 'Updated Name' });
    const { service } = makeService({
      findFirst: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue(updated),
    });

    const result = await service.update('sup-1', 'tenant-abc', { razonSocial: 'Updated Name' });
    expect(result.razonSocial).toBe('Updated Name');
  });

  it('throws NotFoundError when supplier does not exist', async () => {
    const { service } = makeService({ findFirst: jest.fn().mockResolvedValue(null) });
    await expect(service.update('nonexistent', 'tenant-abc', {})).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError for invalid update data', async () => {
    const existing = makeSupplier();
    const { service } = makeService({ findFirst: jest.fn().mockResolvedValue(existing) });
    await expect(service.update('sup-1', 'tenant-abc', { calificacion: 99 })).rejects.toThrow(
      ValidationError,
    );
  });
});

// ─── delete ──────────────────────────────────────────────────────────────────

describe('SupplierService.delete', () => {
  it('soft-deletes a supplier and returns true', async () => {
    const existing = makeSupplier();
    const { service, prisma } = makeService({
      findFirst: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue({ ...existing, isActive: false }),
    });

    const result = await service.delete('sup-1', 'tenant-abc');
    expect(result).toBe(true);
    expect(prisma.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it('throws NotFoundError when supplier does not exist', async () => {
    const { service } = makeService({ findFirst: jest.fn().mockResolvedValue(null) });
    await expect(service.delete('nonexistent', 'tenant-abc')).rejects.toThrow(NotFoundError);
  });
});

// ─── search ──────────────────────────────────────────────────────────────────

describe('SupplierService.search', () => {
  it('delegates to prisma.findMany and returns results', async () => {
    const suppliers = [makeSupplier(), makeSupplier({ id: 'sup-2' })];
    const { service, prisma } = makeService({
      findMany: jest.fn().mockResolvedValue(suppliers),
    });

    const results = await service.search('tenant-abc', 'Acme');
    expect(results).toHaveLength(2);
    expect(prisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-abc' }) }),
    );
  });

  it('returns empty array when no matches', async () => {
    const { service } = makeService({ findMany: jest.fn().mockResolvedValue([]) });
    const results = await service.search('tenant-abc', 'NoMatch');
    expect(results).toEqual([]);
  });
});
