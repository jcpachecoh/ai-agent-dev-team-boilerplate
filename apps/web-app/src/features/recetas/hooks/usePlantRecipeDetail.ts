import { useQuery } from '@tanstack/react-query';

import { getPlantRecipeDetail } from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';

export function usePlantRecipeDetail(recipeId: string | null) {
  return useQuery({
    queryKey: plantKeys.recipe(recipeId ?? ''),
    queryFn: () => getPlantRecipeDetail(recipeId!),
    enabled: Boolean(recipeId),
  });
}
