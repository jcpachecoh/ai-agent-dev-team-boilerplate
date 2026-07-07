import { useQuery } from '@tanstack/react-query';

import { fetchRecipeImages } from '../api/recipe-images.api';

export const recipeImageKeys = {
  all: ['recipe-images'] as const,
  byRecipe: (recipeId: string) => [...recipeImageKeys.all, recipeId] as const,
};

export function useRecipeImages(recipeId: string | null) {
  return useQuery({
    queryKey: recipeImageKeys.byRecipe(recipeId ?? ''),
    queryFn: () => fetchRecipeImages(recipeId!),
    enabled: Boolean(recipeId),
  });
}
