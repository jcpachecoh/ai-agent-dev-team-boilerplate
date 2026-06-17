import { useQuery } from '@tanstack/react-query';

import { getPlantRecipes, loadRecipePhaseCounts } from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';

import { mapPlantRecipeToListItem } from '../mappers/recipes.mapper';
import type { RecipeListItem } from '../types';

export function usePlantRecipes(enabled = true) {
  return useQuery({
    queryKey: plantKeys.recipes(),
    queryFn: async (): Promise<RecipeListItem[]> => {
      const recipes = await getPlantRecipes();
      const phaseCounts = await loadRecipePhaseCounts(recipes);
      return recipes.map((recipe) =>
        mapPlantRecipeToListItem(recipe, phaseCounts.get(recipe.id) ?? 0),
      );
    },
    enabled,
  });
}
