import { describe, expect, it } from '@jest/globals';
import { Decimal } from '@prisma/client/runtime/library';
import { RecipeUsageUnit, StockUnit } from '@prisma/client';

import {
  calculateShrinkagePercent,
  convertQuantityToGrams,
  isNetQuantityValid,
  isUsageUnitCoherentWithStockUnit,
  mapUsageUnitToStockUnit,
} from '../utils/recipe-composition.utils';

describe('recipe-composition.utils', () => {
  it('calculates shrinkage percent', () => {
    expect(calculateShrinkagePercent(new Decimal('2.000'), new Decimal('1.500'))).toBe(25);
  });

  it('returns zero shrinkage when gross is zero or negative', () => {
    expect(calculateShrinkagePercent(new Decimal('0'), new Decimal('0'))).toBe(0);
    expect(calculateShrinkagePercent(new Decimal('-1'), new Decimal('0'))).toBe(0);
  });

  it('validates net not greater than gross', () => {
    expect(isNetQuantityValid(new Decimal('2'), new Decimal('1.5'))).toBe(true);
    expect(isNetQuantityValid(new Decimal('1'), new Decimal('2'))).toBe(false);
    expect(isNetQuantityValid(new Decimal('0'), new Decimal('0'))).toBe(false);
    expect(isNetQuantityValid(new Decimal('2'), new Decimal('0'))).toBe(false);
  });

  it('maps usage units to stock units', () => {
    expect(mapUsageUnitToStockUnit(RecipeUsageUnit.GRAM)).toBe(StockUnit.GRAMS);
    expect(mapUsageUnitToStockUnit(RecipeUsageUnit.OUNCE)).toBe(StockUnit.GRAMS);
    expect(mapUsageUnitToStockUnit(RecipeUsageUnit.MILLILITER)).toBe(StockUnit.ML);
    expect(mapUsageUnitToStockUnit(RecipeUsageUnit.KILOGRAM)).toBe(StockUnit.KILOGRAMS);
    expect(mapUsageUnitToStockUnit(RecipeUsageUnit.LITER)).toBe(StockUnit.LITERS);
    expect(mapUsageUnitToStockUnit(RecipeUsageUnit.UNIT)).toBe(StockUnit.UNIT);
  });

  it('converts usage units to grams', () => {
    expect(convertQuantityToGrams(new Decimal('500'), RecipeUsageUnit.GRAM)).toBe(500);
    expect(convertQuantityToGrams(new Decimal('2'), RecipeUsageUnit.KILOGRAM)).toBe(2000);
    expect(convertQuantityToGrams(new Decimal('1'), RecipeUsageUnit.OUNCE)).toBeCloseTo(28.3495);
    expect(convertQuantityToGrams(new Decimal('250'), RecipeUsageUnit.MILLILITER)).toBe(250);
    expect(convertQuantityToGrams(new Decimal('1.5'), RecipeUsageUnit.LITER)).toBe(1.5);
    expect(convertQuantityToGrams(new Decimal('3'), RecipeUsageUnit.UNIT)).toBe(3);
  });

  it('checks usage unit coherence with stock unit', () => {
    expect(isUsageUnitCoherentWithStockUnit(RecipeUsageUnit.GRAM, StockUnit.GRAMS)).toBe(true);
    expect(isUsageUnitCoherentWithStockUnit(RecipeUsageUnit.LITER, StockUnit.GRAMS)).toBe(false);
    expect(isUsageUnitCoherentWithStockUnit(RecipeUsageUnit.OUNCE, StockUnit.GRAMS)).toBe(true);
    expect(isUsageUnitCoherentWithStockUnit(RecipeUsageUnit.MILLILITER, StockUnit.ML)).toBe(true);
  });
});
