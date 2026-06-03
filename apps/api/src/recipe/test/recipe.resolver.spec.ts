import { Test, TestingModule } from '@nestjs/testing';
import { RecipeResolver } from '../resolver/recipe.resolver';
import { RecipeService } from '../service/recipe.service';

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

const serviceMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

describe('RecipeResolver', () => {
  let resolver: RecipeResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeResolver,
        { provide: RecipeService, useValue: serviceMock },
        {
          provide: 'PUB_SUB',
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
            asyncIterator: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<RecipeResolver>(RecipeResolver);
    jest.clearAllMocks();
  });

  it('delegates recipes to the service', async () => {
    serviceMock.findAll.mockResolvedValue([mockRecipe]);

    const result = await resolver.recipes(
      { req: { headers: { 'x-tenant-id': tenantId } } } as never,
      10,
      0,
    );

    expect(result).toEqual([mockRecipe]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, { limit: 10, offset: 0 });
  });

  it('publishes recipeUpdated when creating a recipe', async () => {
    serviceMock.create.mockResolvedValue(mockRecipe);

    const result = await resolver.createRecipe(
      { req: { headers: { 'x-tenant-id': tenantId } } } as never,
      { name: 'Recipe 1' },
    );

    expect(result).toEqual(mockRecipe);
    expect(serviceMock.create).toHaveBeenCalledWith(tenantId, { name: 'Recipe 1' });
  });
});
