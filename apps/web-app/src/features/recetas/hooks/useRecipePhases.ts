import {
  buildPhasesTimeWarning,
  calculatePhasesTotalMinutes,
  createEmptyPhaseRow,
  mapFormRowsToSyncInput,
  mapPlantPhasesToFormRows,
  reorderPhaseRows,
} from '@/features/recetas/mappers/phases.mapper';
import type { RecipeCompositionRow, RecipePhaseFormRow } from '@/features/recetas/types';
import { validateRecipePhaseRows } from '@/features/recetas/validation/recipePhases.schema';

interface UseRecipePhasesOptions {
  estimatedMinutes?: number;
}

export function useRecipePhases({ estimatedMinutes = 0 }: UseRecipePhasesOptions = {}) {
  return {
    createEmptyRow(order: number) {
      return createEmptyPhaseRow(order);
    },
    reorderRows(rows: RecipePhaseFormRow[]) {
      return reorderPhaseRows(rows);
    },
    validate(rows: RecipePhaseFormRow[]) {
      return validateRecipePhaseRows(rows);
    },
    totalMinutes(rows: RecipePhaseFormRow[]) {
      return calculatePhasesTotalMinutes(rows);
    },
    timeWarning(rows: RecipePhaseFormRow[]) {
      return buildPhasesTimeWarning(calculatePhasesTotalMinutes(rows), estimatedMinutes);
    },
    mapFromApi(
      phases: Parameters<typeof mapPlantPhasesToFormRows>[0],
      composition: RecipeCompositionRow[],
    ) {
      return mapPlantPhasesToFormRows(phases, composition);
    },
    mapToSync(
      rows: RecipePhaseFormRow[],
      composition: RecipeCompositionRow[],
      defaultWorkStationId: string,
    ) {
      return mapFormRowsToSyncInput(rows, composition, defaultWorkStationId);
    },
  };
}
