/**
 * Supplier resolver tests
 *
 * Tests the SupplierService:
 *  - findAll returns tenant-scoped results
 *  - findAll with a different tenantId is isolated
 *  - unauthenticated context triggers AuthenticationError via requireAuth
 */

import { SupplierService } from '../../src/services/supplier.service';
import { AuthenticationError } from '../../src/utils/errors';
import { requireAuth } from '../../src/auth/roles.guard';
import { UserRole } from '../../src/auth/types';
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

function makePrisma(suppliers: Supplier[]) {
  return {
    supplier: {
      findMany: jest.fn(({ where }: { where: { tenantId: string } }) =>
        Promise.resolve(suppliers.filter((s) => s.tenantId === where.tenantId && s.isActive)),
      ),
      findFirst: jest.fn(({ where }: { where: { id: string; tenantId: string } }) =>
        Promise.resolve(
          suppliers.find((s) => s.id === where.id && s.tenantId === where.tenantId) ?? null,
        ),
      ),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

function makeService(suppliers: Supplier[] = []) {
  const prisma = makePrisma(suppliers);
  const redis = {} as never;
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as never;
  return { service: new SupplierService(prisma as never, redis, log), prisma };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SupplierService.findAll', () => {
  it('returns suppliers scoped to the tenantId', async () => {
    const suppliers = [
      makeSupplier({ id: 'sup-1', tenantId: 'tenant-abc' }),
      makeSupplier({ id: 'sup-2', tenantId: 'tenant-abc' }),
      makeSupplier({ id: 'sup-3', tenantId: 'tenant-xyz' }), // different tenant
    ];

    const { service } = makeService(suppliers);
    const result = await service.findAll('tenant-abc');

    expect(result).toHaveLength(2);
    expect(result.every((s) => s.tenantId === 'tenant-abc')).toBe(true);
  });

  it('returns empty array when tenant has no suppliers', async () => {
    const { service } = makeService([]);
    const result = await service.findAll('tenant-empty');
    expect(result).toEqual([]);
  });

  it('does not return suppliers of other tenants', async () => {
    const suppliers = [makeSupplier({ id: 'sup-1', tenantId: 'tenant-other' })];
    const { service } = makeService(suppliers);
    const result = await service.findAll('tenant-abc');
    expect(result).toHaveLength(0);
  });
});

describe('requireAuth guard', () => {
  it('throws AuthenticationError for null user (unauthenticated)', () => {
    expect(() => requireAuth(null)).toThrow(AuthenticationError);
    expect(() => requireAuth(null)).toThrow('You must be logged in');
  });

  it('returns the user when authenticated', () => {
    const user = { id: 'u1', tenantId: 'tenant-abc', role: UserRole.OPERATOR };
    expect(requireAuth(user)).toBe(user);
  });
});

describe('SupplierService.findById', () => {
  it('throws NotFoundError when supplier does not exist', async () => {
    const { service } = makeService([]);
    const { NotFoundError } = await import('../../src/utils/errors');
    await expect(service.findById('nonexistent', 'tenant-abc')).rejects.toThrow(NotFoundError);
  });

  it('returns the supplier when found', async () => {
    const supplier = makeSupplier();
    const { service } = makeService([supplier]);
    const result = await service.findById('sup-1', 'tenant-abc');
    expect(result.id).toBe('sup-1');
  });
});
