import { Test, type TestingModule } from '@nestjs/testing';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { RecipeImagesResolver } from '../resolver/recipe-images.resolver';
import { RecipeImagesService } from '../service/recipe-images.service';

const tenantId = 'tenant-1';

const jwtUser: JwtPayload = {
  sub: 'user-1',
  email: 'owner@test.dev',
  tenantId,
  roleId: 'role-1',
  roleCode: 'OWNER',
};

const baseImage = {
  id: 'img-1',
  tenantId,
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

const serviceMock = {
  listByRecipe: jest.fn(),
  add: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
};

describe('RecipeImagesResolver', () => {
  let resolver: RecipeImagesResolver;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RecipeImagesResolver, { provide: RecipeImagesService, useValue: serviceMock }],
    }).compile();

    resolver = module.get(RecipeImagesResolver);
  });

  it('recipeImages delegates to service with tenantId', async () => {
    serviceMock.listByRecipe.mockResolvedValue([baseImage]);

    const result = await resolver.recipeImages(jwtUser, 'recipe-1');

    expect(serviceMock.listByRecipe).toHaveBeenCalledWith(tenantId, 'recipe-1', undefined);
    expect(result).toEqual([baseImage]);
  });

  it('addRecipeImage delegates to service', async () => {
    serviceMock.add.mockResolvedValue(baseImage);

    const result = await resolver.addRecipeImage(jwtUser, {
      recipeId: 'recipe-1',
      nameImage: 'harina.jpg',
      url: 'https://cdn.example.com/harina.jpg',
    });

    expect(serviceMock.add).toHaveBeenCalledWith(tenantId, {
      recipeId: 'recipe-1',
      nameImage: 'harina.jpg',
      url: 'https://cdn.example.com/harina.jpg',
    });
    expect(result).toEqual(baseImage);
  });

  it('updateRecipeImage separates id from payload', async () => {
    serviceMock.update.mockResolvedValue(baseImage);

    await resolver.updateRecipeImage(jwtUser, {
      id: 'img-1',
      alt: 'Nuevo alt',
    });

    expect(serviceMock.update).toHaveBeenCalledWith(tenantId, 'img-1', { alt: 'Nuevo alt' });
  });

  it('deactivateRecipeImage delegates to service', async () => {
    serviceMock.deactivate.mockResolvedValue({ ...baseImage, isActive: false });

    await resolver.deactivateRecipeImage(jwtUser, 'img-1');

    expect(serviceMock.deactivate).toHaveBeenCalledWith(tenantId, 'img-1');
  });
});
