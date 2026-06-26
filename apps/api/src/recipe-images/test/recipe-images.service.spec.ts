import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { RecipeImagesRepository } from '../repository/recipe-images.repository';
import { RecipeImagesService } from '../service/recipe-images.service';

const mockRepo = {
  findByRecipeId: jest.fn(),
  findById: jest.fn(),
  countActiveByRecipeId: jest.fn(),
  recipeExists: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
};

const baseImage = {
  id: 'img-1',
  tenantId: 'tenant-1',
  recipeId: 'recipe-1',
  alt: 'Harina',
  nameImage: 'harina.jpg',
  url: 'https://cdn.example.com/harina.jpg',
  storageObjectId: null,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RecipeImagesService', () => {
  let service: RecipeImagesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecipeImagesService, { provide: RecipeImagesRepository, useValue: mockRepo }],
    }).compile();

    service = module.get(RecipeImagesService);
  });

  it('listByRecipe returns images for an existing recipe', async () => {
    mockRepo.recipeExists.mockResolvedValue(true);
    mockRepo.findByRecipeId.mockResolvedValue([baseImage]);

    const result = await service.listByRecipe('tenant-1', 'recipe-1');

    expect(result).toEqual([baseImage]);
  });

  it('listByRecipe throws when recipe does not exist', async () => {
    mockRepo.recipeExists.mockResolvedValue(false);

    await expect(service.listByRecipe('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('add creates image when below the active limit', async () => {
    mockRepo.recipeExists.mockResolvedValue(true);
    mockRepo.countActiveByRecipeId.mockResolvedValue(1);
    mockRepo.create.mockResolvedValue(baseImage);

    const result = await service.add('tenant-1', {
      recipeId: 'recipe-1',
      nameImage: 'harina.jpg',
      url: 'https://cdn.example.com/harina.jpg',
    });

    expect(result).toEqual(baseImage);
  });

  it('add throws ConflictException when active limit is reached', async () => {
    mockRepo.recipeExists.mockResolvedValue(true);
    mockRepo.countActiveByRecipeId.mockResolvedValue(10);

    await expect(
      service.add('tenant-1', {
        recipeId: 'recipe-1',
        nameImage: 'harina.jpg',
        url: 'https://cdn.example.com/harina.jpg',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('add throws when recipe does not exist', async () => {
    mockRepo.recipeExists.mockResolvedValue(false);

    await expect(
      service.add('tenant-1', {
        recipeId: 'missing',
        nameImage: 'harina.jpg',
        url: 'https://cdn.example.com/harina.jpg',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('add throws BadRequestException when url is empty', async () => {
    mockRepo.recipeExists.mockResolvedValue(true);

    await expect(
      service.add('tenant-1', {
        recipeId: 'recipe-1',
        nameImage: 'harina.jpg',
        url: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('update updates alt and nameImage', async () => {
    mockRepo.findById.mockResolvedValue(baseImage);
    mockRepo.update.mockResolvedValue({ ...baseImage, alt: 'Nuevo alt' });

    const result = await service.update('tenant-1', 'img-1', { alt: 'Nuevo alt' });

    expect(result.alt).toBe('Nuevo alt');
  });

  it('update throws when image does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.update('tenant-1', 'missing', { alt: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deactivate sets image inactive', async () => {
    mockRepo.findById.mockResolvedValue(baseImage);
    mockRepo.deactivate.mockResolvedValue({ ...baseImage, isActive: false });

    const result = await service.deactivate('tenant-1', 'img-1');

    expect(result.isActive).toBe(false);
  });

  it('deactivate is idempotent when image is already inactive', async () => {
    const inactive = { ...baseImage, isActive: false };
    mockRepo.findById.mockResolvedValue(inactive);

    const result = await service.deactivate('tenant-1', 'img-1');

    expect(result).toEqual(inactive);
    expect(mockRepo.deactivate).not.toHaveBeenCalled();
  });

  it('deactivate throws when image does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.deactivate('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
  });
});
