import { describe, expect, it } from 'vitest';

import {
  recipeCompositionRowSchema,
  recipeCompositionSchema,
  validateRecipeComposition,
} from './recipeComposition.schema';

describe('recipeComposition.schema', () => {
  const validRow = {
    supplyItemId: 'supply-1',
    componentType: 'INGREDIENT' as const,
    usageUnit: 'GRAM' as const,
    grossQuantity: '1.250',
    netQuantity: '1.000',
  };

  it('accepts a valid row with three decimal places', () => {
    expect(recipeCompositionRowSchema.safeParse(validRow).success).toBe(true);
  });

  it('rejects net quantity greater than gross', () => {
    const result = recipeCompositionRowSchema.safeParse({
      ...validRow,
      grossQuantity: '1.000',
      netQuantity: '1.500',
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one row in composition', () => {
    expect(recipeCompositionSchema.safeParse([]).success).toBe(false);
  });

  it('validateRecipeComposition returns field errors for incomplete rows', () => {
    const result = validateRecipeComposition([
      {
        supplyItemId: '',
        componentType: 'INGREDIENT',
        usageUnit: 'GRAM',
        grossQuantity: '1',
        netQuantity: '1',
      },
    ]);
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['composition.0.supplyItemId']).toBeTruthy();
  });
});
