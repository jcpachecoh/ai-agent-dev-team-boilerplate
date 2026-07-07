import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RecipeService } from '../service/recipe.service';
import { RecipeRepository } from '../repository/recipe.repository';

const tenantId = 'tenant-1';
const mockRecipe = {
  id: 'r-1',
  name: 'Recipe 1',
  description: null,
  tenantId,
  phases: [],
  yieldAmount: null,
  yieldUnit: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecipeService, { provide: RecipeRepository, useValue: repoMock }],
    }).compile();

    service = module.get<RecipeService>(RecipeService);
    jest.clearAllMocks();
  });

  it('returns recipes for tenant', async () => {
    repoMock.findAll.mockResolvedValue([mockRecipe]);
    await expect(service.findAll(tenantId, { limit: 10 })).resolves.toEqual([mockRecipe]);
  });

  it('throws not found when recipe missing', async () => {
    repoMock.findById.mockResolvedValue(null);
    await expect(service.findById('missing', tenantId)).rejects.toThrow(NotFoundException);
  });

  it('creates a validated recipe', async () => {
    repoMock.create.mockResolvedValue(mockRecipe);

    await expect(service.create(tenantId, { name: 'Recipe 1' })).resolves.toEqual(mockRecipe);
    expect(repoMock.create).toHaveBeenCalled();
  });
});
