import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GraphqlRequestError } from '@/lib/graphql-client';

import {
  addRecipeImage,
  deactivateRecipeImage,
  fetchRecipeImages,
  RecipeImagesApiError,
  updateRecipeImage,
} from './recipe-images.api';

const graphqlRequestMock = vi.fn();

vi.mock('@/lib/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/graphql-client')>();
  return {
    ...actual,
    graphqlRequest: (...args: unknown[]) => graphqlRequestMock(...args),
  };
});

describe('recipe-images.api', () => {
  beforeEach(() => {
    graphqlRequestMock.mockReset();
  });

  it('fetchRecipeImages returns recipe images', async () => {
    graphqlRequestMock.mockResolvedValue({
      recipeImages: [
        {
          id: 'img-1',
          recipeId: 'recipe-1',
          alt: 'Harina',
          nameImage: 'harina.jpg',
          url: 'https://cdn.example.com/harina.jpg',
          storageObjectId: null,
          sortOrder: 0,
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    const result = await fetchRecipeImages('recipe-1');

    expect(result).toHaveLength(1);
    expect(graphqlRequestMock).toHaveBeenCalledWith(expect.stringContaining('query RecipeImages'), {
      recipeId: 'recipe-1',
    });
  });

  it('addRecipeImage sends mutation input', async () => {
    graphqlRequestMock.mockResolvedValue({
      addRecipeImage: {
        id: 'img-1',
        recipeId: 'recipe-1',
        alt: null,
        nameImage: 'harina.jpg',
        url: 'https://cdn.example.com/harina.jpg',
        storageObjectId: null,
        sortOrder: 0,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    });

    await addRecipeImage({
      recipeId: 'recipe-1',
      nameImage: 'harina.jpg',
      url: 'https://cdn.example.com/harina.jpg',
    });

    expect(graphqlRequestMock).toHaveBeenCalledWith(
      expect.stringContaining('mutation AddRecipeImage'),
      {
        input: {
          recipeId: 'recipe-1',
          nameImage: 'harina.jpg',
          url: 'https://cdn.example.com/harina.jpg',
        },
      },
    );
  });

  it('updateRecipeImage sends mutation input', async () => {
    graphqlRequestMock.mockResolvedValue({
      updateRecipeImage: {
        id: 'img-1',
        recipeId: 'recipe-1',
        alt: 'Nuevo alt',
        nameImage: 'harina.jpg',
        url: 'https://cdn.example.com/harina.jpg',
        storageObjectId: null,
        sortOrder: 0,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    });

    await updateRecipeImage({ id: 'img-1', alt: 'Nuevo alt' });

    expect(graphqlRequestMock).toHaveBeenCalledWith(
      expect.stringContaining('mutation UpdateRecipeImage'),
      { input: { id: 'img-1', alt: 'Nuevo alt' } },
    );
  });

  it('deactivateRecipeImage sends mutation id', async () => {
    graphqlRequestMock.mockResolvedValue({
      deactivateRecipeImage: {
        id: 'img-1',
        recipeId: 'recipe-1',
        alt: null,
        nameImage: 'harina.jpg',
        url: 'https://cdn.example.com/harina.jpg',
        storageObjectId: null,
        sortOrder: 0,
        isActive: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    });

    await deactivateRecipeImage('img-1');

    expect(graphqlRequestMock).toHaveBeenCalledWith(
      expect.stringContaining('mutation DeactivateRecipeImage'),
      { id: 'img-1' },
    );
  });

  it('wraps GraphQL errors as RecipeImagesApiError', async () => {
    graphqlRequestMock.mockRejectedValue(new GraphqlRequestError('Conflict', 'CONFLICT'));

    await expect(fetchRecipeImages('recipe-1')).rejects.toBeInstanceOf(RecipeImagesApiError);
  });
});
