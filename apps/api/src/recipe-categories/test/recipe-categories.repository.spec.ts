import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipeCategoriesRepository } from '../repository/recipe-categories.repository';

const prismaMock = {
  recipeCategory: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('RecipeCategoriesRepository', () => {
  let repository: RecipeCategoriesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecipeCategoriesRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<RecipeCategoriesRepository>(RecipeCategoriesRepository);
    jest.clearAllMocks();
  });

  it('findAll filters by tenant and optional isActive', async () => {
    prismaMock.recipeCategory.findMany.mockResolvedValue([]);

    await repository.findAll('tenant-1', true);

    expect(prismaMock.recipeCategory.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', isActive: true },
      orderBy: { nombre: 'asc' },
    });
  });

  it('findAll omits isActive filter when not provided', async () => {
    prismaMock.recipeCategory.findMany.mockResolvedValue([]);

    await repository.findAll('tenant-1');

    expect(prismaMock.recipeCategory.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { nombre: 'asc' },
    });
  });

  it('findOne queries by id and tenant', async () => {
    prismaMock.recipeCategory.findFirst.mockResolvedValue(null);

    await repository.findOne('tenant-1', 'rcat-1');

    expect(prismaMock.recipeCategory.findFirst).toHaveBeenCalledWith({
      where: { id: 'rcat-1', tenantId: 'tenant-1' },
    });
  });

  it('create persists category for tenant', async () => {
    prismaMock.recipeCategory.create.mockResolvedValue({ id: 'rcat-1' });

    await repository.create('tenant-1', { nombre: 'Test', descripcion: 'desc' });

    expect(prismaMock.recipeCategory.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', nombre: 'Test', descripcion: 'desc' },
    });
  });

  it('update patches category fields', async () => {
    prismaMock.recipeCategory.update.mockResolvedValue({ id: 'rcat-1' });

    await repository.update('tenant-1', 'rcat-1', { nombre: 'Nuevo', isActive: false });

    expect(prismaMock.recipeCategory.update).toHaveBeenCalledWith({
      where: { id: 'rcat-1' },
      data: { nombre: 'Nuevo', isActive: false },
    });
  });

  it('remove deletes by id and tenant', async () => {
    prismaMock.recipeCategory.deleteMany.mockResolvedValue({ count: 1 });

    await repository.remove('tenant-1', 'rcat-1');

    expect(prismaMock.recipeCategory.deleteMany).toHaveBeenCalledWith({
      where: { id: 'rcat-1', tenantId: 'tenant-1' },
    });
  });
});
