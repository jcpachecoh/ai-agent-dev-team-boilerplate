import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createPlantRecipe,
  syncPlantRecipePhases,
  updatePlantRecipe,
  type SyncPlantRecipePhaseInput,
} from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';
import type { CreatePlantRecipeInput } from '@/api/plant/types';

export type UpdatePlantRecipePayload = Partial<
  Pick<
    CreatePlantRecipeInput,
    | 'name'
    | 'categoryId'
    | 'finishedProductId'
    | 'batchSize'
    | 'batchUnit'
    | 'packageWeight'
    | 'estimatedMinutes'
    | 'notes'
    | 'isActive'
  >
>;

export type SavePlantRecipeInput =
  | {
      mode: 'create';
      payload: CreatePlantRecipeInput;
    }
  | {
      mode: 'update';
      recipeId: string;
      payload: UpdatePlantRecipePayload;
      phases: SyncPlantRecipePhaseInput[];
      originalPhaseIds: string[];
    };

export function useSavePlantRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePlantRecipeInput) => {
      if (input.mode === 'create') {
        return createPlantRecipe(input.payload);
      }

      await updatePlantRecipe(input.recipeId, input.payload);
      await syncPlantRecipePhases(input.recipeId, input.phases, input.originalPhaseIds);
      return { id: input.recipeId };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plantKeys.all });
    },
  });
}
