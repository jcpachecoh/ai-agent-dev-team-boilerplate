import { getGraphqlAuthToken } from '@/lib/auth-token';
import { GraphqlRequestError, graphqlRequest } from '@/lib/graphql-client';
import { getTenantId } from '@/lib/tenant';

import {
  ADD_RECIPE_IMAGE_MUTATION,
  DEACTIVATE_RECIPE_IMAGE_MUTATION,
  RECIPE_IMAGES_QUERY,
  UPDATE_RECIPE_IMAGE_MUTATION,
} from './recipe-images.graphql';

export interface RecipeImage {
  id: string;
  recipeId: string;
  alt: string | null;
  nameImage: string;
  url: string;
  storageObjectId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRecipeImageFileResult {
  id: string;
  publicUrl: string | null;
  originalName: string;
}

export class RecipeImagesApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'RecipeImagesApiError';
  }
}

export async function fetchRecipeImages(recipeId: string): Promise<RecipeImage[]> {
  try {
    const data = await graphqlRequest<{ recipeImages: RecipeImage[] }>(RECIPE_IMAGES_QUERY, {
      recipeId,
    });
    return data.recipeImages;
  } catch (error) {
    throw toRecipeImagesApiError(error, 'recipeImages');
  }
}

export async function addRecipeImage(input: {
  recipeId: string;
  nameImage: string;
  url: string;
  alt?: string;
  storageObjectId?: string;
  sortOrder?: number;
}): Promise<RecipeImage> {
  try {
    const data = await graphqlRequest<{ addRecipeImage: RecipeImage }>(ADD_RECIPE_IMAGE_MUTATION, {
      input,
    });
    return data.addRecipeImage;
  } catch (error) {
    throw toRecipeImagesApiError(error, 'addRecipeImage');
  }
}

export async function updateRecipeImage(input: {
  id: string;
  alt?: string;
  nameImage?: string;
  sortOrder?: number;
}): Promise<RecipeImage> {
  try {
    const data = await graphqlRequest<{ updateRecipeImage: RecipeImage }>(
      UPDATE_RECIPE_IMAGE_MUTATION,
      { input },
    );
    return data.updateRecipeImage;
  } catch (error) {
    throw toRecipeImagesApiError(error, 'updateRecipeImage');
  }
}

export async function deactivateRecipeImage(id: string): Promise<RecipeImage> {
  try {
    const data = await graphqlRequest<{ deactivateRecipeImage: RecipeImage }>(
      DEACTIVATE_RECIPE_IMAGE_MUTATION,
      { id },
    );
    return data.deactivateRecipeImage;
  } catch (error) {
    throw toRecipeImagesApiError(error, 'deactivateRecipeImage');
  }
}

export async function uploadRecipeImageFile(
  recipeId: string,
  file: File,
): Promise<UploadRecipeImageFileResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', 'RECIPES');
  formData.append('imageProfile', 'RECIPE');
  formData.append('entityType', 'ProductionRecipe');
  formData.append('entityId', recipeId);

  const headers: Record<string, string> = {
    'x-tenant-id': getTenantId(),
  };

  const token = getGraphqlAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    throw new RecipeImagesApiError(message || 'No se pudo subir la imagen de la receta.');
  }

  const result = (await response.json()) as UploadRecipeImageFileResult;
  if (!result.publicUrl) {
    throw new RecipeImagesApiError('El storage no devolvió una URL pública para la imagen.');
  }

  return result;
}

function toRecipeImagesApiError(error: unknown, operation: string): RecipeImagesApiError {
  if (error instanceof RecipeImagesApiError) {
    return error;
  }

  if (error instanceof GraphqlRequestError) {
    return new RecipeImagesApiError(error.message, error.code);
  }

  if (error instanceof Error) {
    return new RecipeImagesApiError(error.message);
  }

  return new RecipeImagesApiError(`Error en operación ${operation}`);
}
