import { RecipeUsageUnit, StockUnit } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

const OUNCE_TO_GRAMS = 28.3495;

export function calculateShrinkagePercent(gross: Decimal, net: Decimal): number {
  if (gross.lte(0)) {
    return 0;
  }
  const diff = gross.minus(net);
  return Number(diff.div(gross).mul(100).toFixed(2));
}

export function isNetQuantityValid(gross: Decimal, net: Decimal): boolean {
  return net.gt(0) && gross.gt(0) && net.lte(gross);
}

export function mapUsageUnitToStockUnit(unit: RecipeUsageUnit): StockUnit {
  switch (unit) {
    case RecipeUsageUnit.GRAM:
    case RecipeUsageUnit.OUNCE:
      return StockUnit.GRAMS;
    case RecipeUsageUnit.MILLILITER:
      return StockUnit.ML;
    case RecipeUsageUnit.KILOGRAM:
      return StockUnit.KILOGRAMS;
    case RecipeUsageUnit.LITER:
      return StockUnit.LITERS;
    case RecipeUsageUnit.UNIT:
    default:
      return StockUnit.UNIT;
  }
}

export function convertQuantityToGrams(quantity: Decimal, unit: RecipeUsageUnit): number {
  const value = quantity.toNumber();
  switch (unit) {
    case RecipeUsageUnit.GRAM:
      return value;
    case RecipeUsageUnit.KILOGRAM:
      return value * 1000;
    case RecipeUsageUnit.OUNCE:
      return value * OUNCE_TO_GRAMS;
    case RecipeUsageUnit.MILLILITER:
    case RecipeUsageUnit.LITER:
    case RecipeUsageUnit.UNIT:
    default:
      return value;
  }
}

export function isUsageUnitCoherentWithStockUnit(
  usageUnit: RecipeUsageUnit,
  stockUnit: StockUnit,
): boolean {
  return mapUsageUnitToStockUnit(usageUnit) === stockUnit;
}
