import { useMemo } from 'react';

import type { PlantRecipeCompositionLine } from '@/api/plant/types';
import {
  buildBatchWeightWarning,
  calculateTotalNetGrams,
  createEmptyCompositionRow,
  duplicateCompositionRow,
  formatCompositionTotalLabel,
  mapPlantCompositionToRow,
} from '@/features/recetas/mappers/composition.mapper';
import type { RecipeCompositionRow } from '@/features/recetas/types';
import { validateRecipeCompositionRows } from '@/features/recetas/validation/recipeComposition.schema';

interface UseRecipeCompositionOptions {
  initialLines?: PlantRecipeCompositionLine[];
  packageWeightGrams: string;
}

export function useRecipeComposition({
  initialLines,
  packageWeightGrams,
}: UseRecipeCompositionOptions) {
  const initialRows = useMemo(
    () =>
      (initialLines ?? []).map(mapPlantCompositionToRow).sort((a, b) => a.sortOrder - b.sortOrder),
    [initialLines],
  );

  return {
    initialRows,
    createRow: createEmptyCompositionRow,
    duplicateRow: duplicateCompositionRow,
    validate(rows: RecipeCompositionRow[]) {
      return validateRecipeCompositionRows(rows);
    },
    totalNetGrams(rows: RecipeCompositionRow[]) {
      return calculateTotalNetGrams(rows);
    },
    totalNetLabel(rows: RecipeCompositionRow[]) {
      return formatCompositionTotalLabel(calculateTotalNetGrams(rows));
    },
    batchWeightWarning(rows: RecipeCompositionRow[]) {
      return buildBatchWeightWarning(calculateTotalNetGrams(rows), packageWeightGrams);
    },
  };
}
