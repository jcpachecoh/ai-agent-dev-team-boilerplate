import { useQuery } from '@tanstack/react-query';

import { getPlantOrders, getPlantRecipes, loadRecipePhaseCounts } from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';

import { buildProcessViewData } from '../mappers/recipes.mapper';
import type { ProcessViewData } from '../types';

export function usePlantProcess(enabled = true) {
  return useQuery({
    queryKey: [...plantKeys.orders(), 'process-view'] as const,
    queryFn: async (): Promise<ProcessViewData> => {
      const [recipes, orders] = await Promise.all([getPlantRecipes(), getPlantOrders()]);
      const phaseCounts = await loadRecipePhaseCounts(recipes);
      return buildProcessViewData(recipes, orders, phaseCounts);
    },
    enabled,
  });
}
