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

    await repository.create('tenant-1', { nombre: 'Test', descripcion: 'desc' });

    expect(prismaMock.supplyCategory.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', nombre: 'Test', descripcion: 'desc' },
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
});
