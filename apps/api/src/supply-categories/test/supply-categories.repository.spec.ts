import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplyCategoriesRepository } from '../repository/supply-categories.repository';

const prismaMock = {
  supplyCategory: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('SupplyCategoriesRepository', () => {
  let repository: SupplyCategoriesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyCategoriesRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<SupplyCategoriesRepository>(SupplyCategoriesRepository);
    jest.clearAllMocks();
  });

  it('findAll filters by tenant and optional isActive', async () => {
    prismaMock.supplyCategory.findMany.mockResolvedValue([]);

    await repository.findAll('tenant-1', true);

    expect(prismaMock.supplyCategory.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', isActive: true },
      orderBy: { nombre: 'asc' },
    });
  });

  it('findAll omits isActive filter when not provided', async () => {
    prismaMock.supplyCategory.findMany.mockResolvedValue([]);

    await repository.findAll('tenant-1');

    expect(prismaMock.supplyCategory.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { nombre: 'asc' },
    });
  });

  it('findOne queries by id and tenant', async () => {
    prismaMock.supplyCategory.findFirst.mockResolvedValue(null);

    await repository.findOne('tenant-1', 'cat-1');

    expect(prismaMock.supplyCategory.findFirst).toHaveBeenCalledWith({
      where: { id: 'cat-1', tenantId: 'tenant-1' },
    });
  });

  it('create persists category for tenant', async () => {
    prismaMock.supplyCategory.create.mockResolvedValue({ id: 'cat-1' });

    await repository.create('tenant-1', { nombre: 'Test', prefijo: 'TST', descripcion: 'desc' });

    expect(prismaMock.supplyCategory.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', nombre: 'Test', prefijo: 'TST', descripcion: 'desc' },
    });
  });

  it('update patches category fields', async () => {
    prismaMock.supplyCategory.update.mockResolvedValue({ id: 'cat-1' });

    await repository.update('tenant-1', 'cat-1', { nombre: 'Nuevo', isActive: false });

    expect(prismaMock.supplyCategory.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { nombre: 'Nuevo', isActive: false },
    });
  });

  it('findAll backfills categories missing prefijo', async () => {
    const missingPrefijo = {
      id: 'cat-1',
      tenantId: 'tenant-1',
      nombre: 'Lentejas',
      prefijo: '',
      descripcion: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const fixed = { ...missingPrefijo, prefijo: 'LEN' };

    prismaMock.supplyCategory.findMany
      .mockResolvedValueOnce([missingPrefijo])
      .mockResolvedValueOnce([fixed]);
    prismaMock.supplyCategory.findFirst.mockResolvedValue(null);
    prismaMock.supplyCategory.update.mockResolvedValue(fixed);

    const result = await repository.findAll('tenant-1');

    expect(prismaMock.supplyCategory.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { prefijo: 'LEN' },
    });
    expect(result).toEqual([fixed]);
  });

  it('findOne returns category when prefijo is already set', async () => {
    const row = {
      id: 'cat-1',
      tenantId: 'tenant-1',
      nombre: 'Lentejas',
      prefijo: 'LEN',
      descripcion: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.supplyCategory.findFirst.mockResolvedValue(row);

    await expect(repository.findOne('tenant-1', 'cat-1')).resolves.toEqual(row);
    expect(prismaMock.supplyCategory.update).not.toHaveBeenCalled();
  });

  it('findOne backfills prefijo when missing', async () => {
    const row = {
      id: 'cat-1',
      tenantId: 'tenant-1',
      nombre: 'Lentejas',
      prefijo: null,
      descripcion: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const fixed = { ...row, prefijo: 'LEN' };

    prismaMock.supplyCategory.findFirst.mockResolvedValueOnce(row).mockResolvedValueOnce(null);
    prismaMock.supplyCategory.update.mockResolvedValue(fixed);

    await expect(repository.findOne('tenant-1', 'cat-1')).resolves.toEqual(fixed);
  });

  it('findConflictingByNombre excludes current category when excludeId is provided', async () => {
    prismaMock.supplyCategory.findFirst.mockResolvedValue(null);

    await repository.findConflictingByNombre('tenant-1', 'Lentejas', 'cat-1');

    expect(prismaMock.supplyCategory.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', nombre: 'Lentejas', NOT: { id: 'cat-1' } },
    });
  });

  it('findConflictingByPrefijo queries without exclude when omitted', async () => {
    prismaMock.supplyCategory.findFirst.mockResolvedValue(null);

    await repository.findConflictingByPrefijo('tenant-1', 'LEN');

    expect(prismaMock.supplyCategory.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', prefijo: 'LEN' },
    });
  });

  it('allocateUniquePrefijo appends suffix when base prefijo collides', async () => {
    const row = {
      id: 'cat-2',
      tenantId: 'tenant-1',
      nombre: 'Lentejas',
      prefijo: '',
      descripcion: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.supplyCategory.findMany.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    prismaMock.supplyCategory.findFirst
      .mockResolvedValueOnce({ id: 'cat-other', prefijo: 'LEN' })
      .mockResolvedValueOnce(null);
    prismaMock.supplyCategory.update.mockResolvedValue({ ...row, prefijo: 'LEN2' });

    await repository.findAll('tenant-1');

    expect(prismaMock.supplyCategory.update).toHaveBeenCalledWith({
      where: { id: 'cat-2' },
      data: { prefijo: 'LEN2' },
    });
  });
});
