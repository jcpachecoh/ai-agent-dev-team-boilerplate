import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecipeService } from '../service/recipe.service';
import { RecipeRepository } from '../repository/recipe.repository';
import type { Recipe } from '../interfaces/recipe.interfaces';

const mockRecipe: Recipe = {
  id: 'rec-1',
  name: 'Test Recipe',
  description: null,
  tenantId: 'tenant-1',
  phases: [],
  yieldAmount: null,
  yieldUnit: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('RecipeService', () => {
  let service: RecipeService;
  let repository: jest.Mocked<RecipeRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
        {
          provide: RecipeRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecipeService>(RecipeService);
    repository = module.get(RecipeRepository);
  });

  afterEach(() => jest.resetAllMocks());

  describe('findById', () => {
    it('returns recipe when found', async () => {
      repository.findById.mockResolvedValue(mockRecipe);
      const result = await service.findById('rec-1', 'tenant-1');
      expect(result.id).toBe('rec-1');
    });

    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('missing', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates recipe with valid input', async () => {
      repository.create.mockResolvedValue(mockRecipe);
      const result = await service.create('tenant-1', { name: 'Test Recipe' });
      expect(result.id).toBe('rec-1');
    });
  });
});
