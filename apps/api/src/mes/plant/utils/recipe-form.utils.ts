import { BatchDisplayUnit, StockUnit } from '@prisma/client';

export function mapBatchDisplayUnitToStockUnit(unit: BatchDisplayUnit): StockUnit {
  switch (unit) {
    case BatchDisplayUnit.KILOGRAM:
      return StockUnit.KILOGRAMS;
    case BatchDisplayUnit.LITER:
      return StockUnit.LITERS;
    case BatchDisplayUnit.UNIT:
    case BatchDisplayUnit.PORTION:
    case BatchDisplayUnit.TRAY:
    case BatchDisplayUnit.BATCH:
    default:
      return StockUnit.UNIT;
  }
}

export function gramsToLegacyPackageWeightKg(grams: number): number {
  return grams / 1000;
}
