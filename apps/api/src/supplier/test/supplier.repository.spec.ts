import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplierRepository } from '../repository/supplier.repository';

const tenantId = 'tenant-1';
const supplier = {
  id: 'sup-1',
  tenantId,
  razonSocial: 'Acme',
  nit: '900123456',
  dv: null,
  tipo: 'PERSONA_JURIDICA',
  direccion: null,
  departamento: null,
  ciudad: null,
  telefono: null,
  email: null,
  contactoNombre: null,
  condicionPago: 'CONTADO',
  cupoCredito: 0,
  calificacion: 3,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  supplier: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  supplierProduct: {
    count: jest.fn(),
  },
};

describe('SupplierRepository', () => {
  let repository: SupplierRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    repository = module.get(SupplierRepository);
  });

  it('findAll applies tenant filters and pagination', async () => {
    prismaMock.supplier.findMany.mockResolvedValue([supplier]);

    const result = await repository.findAll(tenantId, {
      filter: 'acme',
      isActive: true,
      condicionPago: 'CONTADO',
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual([supplier]);
    expect(prismaMock.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId, isActive: true, condicionPago: 'CONTADO' }),
        take: 10,
        skip: 0,
      }),
    );
  });

  it('search queries active suppliers', async () => {
    prismaMock.supplier.findMany.mockResolvedValue([supplier]);

    await expect(repository.search(tenantId, 'acme')).resolves.toEqual([supplier]);
  });

  it('findByNit uses tenant and nit composite key', async () => {
    prismaMock.supplier.findUnique.mockResolvedValue(supplier);

    await expect(repository.findByNit(tenantId, '900123456')).resolves.toEqual(supplier);
    expect(prismaMock.supplier.findUnique).toHaveBeenCalledWith({
      where: { tenantId_nit: { tenantId, nit: '900123456' } },
    });
  });

  it('creates, updates, and soft deletes suppliers', async () => {
    prismaMock.supplier.findFirst.mockResolvedValue(supplier);
    prismaMock.supplier.findUnique.mockResolvedValue(supplier);
    prismaMock.supplier.create.mockResolvedValue(supplier);
    prismaMock.supplier.update.mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve(args?.data?.isActive === false ? { ...supplier, isActive: false } : supplier),
    );
    prismaMock.supplierProduct.count.mockResolvedValue(2);

    await expect(repository.findById('sup-1', tenantId)).resolves.toEqual(supplier);
    await expect(
      repository.create(tenantId, {
        razonSocial: 'Acme',
        nit: '900123456',
        tipo: 'PERSONA_JURIDICA' as never,
        condicionPago: 'CONTADO' as never,
        calificacion: 3,
        cupoCredito: 0,
      }),
    ).resolves.toEqual(supplier);
    await expect(repository.update('sup-1', { ciudad: 'Bogota' })).resolves.toEqual(supplier);
    await repository.softDelete('sup-1');
    await expect(repository.countProducts(tenantId, 'sup-1')).resolves.toBe(2);
  });
});
