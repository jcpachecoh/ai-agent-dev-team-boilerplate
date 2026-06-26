import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { RecipeImagesRepository } from '../repository/recipe-images.repository';

const mockPrisma = {
  recipeImage: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  productionRecipe: {
    findFirst: jest.fn(),
  },
};

const baseImage = {
  id: 'img-1',
  tenantId: 'tenant-1',
  recipeId: 'recipe-1',
  alt: 'Harina',
  nameImage: 'harina.jpg',
  url: 'https://cdn.example.com/harina.jpg',
  storageObjectId: 'storage-1',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RecipeImagesRepository', () => {
  let repo: RecipeImagesRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecipeImagesRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repo = module.get(RecipeImagesRepository);
  });

  it('findByRecipeId filters active images by default', async () => {
    mockPrisma.recipeImage.findMany.mockResolvedValue([baseImage]);

    await repo.findByRecipeId('tenant-1', 'recipe-1');

    expect(mockPrisma.recipeImage.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', recipeId: 'recipe-1', isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('findByRecipeId includes inactive images when requested', async () => {
    mockPrisma.recipeImage.findMany.mockResolvedValue([baseImage]);

    await repo.findByRecipeId('tenant-1', 'recipe-1', true);

    expect(mockPrisma.recipeImage.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', recipeId: 'recipe-1' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('findById returns null when image is missing', async () => {
    mockPrisma.recipeImage.findFirst.mockResolvedValue(null);

    const result = await repo.findById('tenant-1', 'missing');

    expect(result).toBeNull();
  });

  it('countActiveByRecipeId counts only active images', async () => {
    mockPrisma.recipeImage.count.mockResolvedValue(2);

    const result = await repo.countActiveByRecipeId('tenant-1', 'recipe-1');

    expect(result).toBe(2);
    expect(mockPrisma.recipeImage.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', recipeId: 'recipe-1', isActive: true },
    });
  });

  it('recipeExists returns true when recipe belongs to tenant', async () => {
    mockPrisma.productionRecipe.findFirst.mockResolvedValue({ id: 'recipe-1' });

    await expect(repo.recipeExists('tenant-1', 'recipe-1')).resolves.toBe(true);
  });

  it('recipeExists returns false when recipe is missing', async () => {
    mockPrisma.productionRecipe.findFirst.mockResolvedValue(null);

    await expect(repo.recipeExists('tenant-1', 'recipe-1')).resolves.toBe(false);
  });

  it('create persists image with tenantId', async () => {
    mockPrisma.recipeImage.create.mockResolvedValue(baseImage);

    await repo.create('tenant-1', {
      recipeId: 'recipe-1',
      nameImage: 'harina.jpg',
      url: 'https://cdn.example.com/harina.jpg',
      alt: 'Harina',
    });

    expect(mockPrisma.recipeImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        recipeId: 'recipe-1',
        isActive: true,
      }),
    });
  });

  it('update applies partial fields', async () => {
    mockPrisma.recipeImage.update.mockResolvedValue(baseImage);

    await repo.update('tenant-1', 'img-1', { alt: 'Nuevo alt' });

    expect(mockPrisma.recipeImage.update).toHaveBeenCalledWith({
      where: { id: 'img-1' },
      data: { alt: 'Nuevo alt' },
    });
  });

  it('deactivate sets isActive to false', async () => {
    mockPrisma.recipeImage.update.mockResolvedValue({ ...baseImage, isActive: false });

    await repo.deactivate('tenant-1', 'img-1');

    expect(mockPrisma.recipeImage.update).toHaveBeenCalledWith({
      where: { id: 'img-1' },
      data: { isActive: false },
    });
  });
});
