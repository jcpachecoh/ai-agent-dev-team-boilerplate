import { useQuery } from '@tanstack/react-query';

import { getRecipeCategories } from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';

export type RecipeCategoriesScope = 'active' | 'all';

export function useRecipeCategories(scope: RecipeCategoriesScope = 'active', enabled = true) {
  const isActive = scope === 'active' ? true : undefined;

  return useQuery({
    queryKey: plantKeys.categories(isActive),
    queryFn: () => getRecipeCategories(isActive),
    enabled,
  });
}
