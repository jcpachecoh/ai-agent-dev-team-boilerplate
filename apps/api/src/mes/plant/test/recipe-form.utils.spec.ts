import { BatchDisplayUnit, StockUnit } from '@prisma/client';

import {
  gramsToLegacyPackageWeightKg,
  mapBatchDisplayUnitToStockUnit,
} from '../utils/recipe-form.utils';

describe('recipe-form.utils', () => {
  describe('mapBatchDisplayUnitToStockUnit', () => {
    it('maps kilogram display unit to kilograms stock unit', () => {
      expect(mapBatchDisplayUnitToStockUnit(BatchDisplayUnit.KILOGRAM)).toBe(StockUnit.KILOGRAMS);
    });

    it('maps liter display unit to liters stock unit', () => {
      expect(mapBatchDisplayUnitToStockUnit(BatchDisplayUnit.LITER)).toBe(StockUnit.LITERS);
    });

    it.each([
      BatchDisplayUnit.UNIT,
      BatchDisplayUnit.PORTION,
      BatchDisplayUnit.TRAY,
      BatchDisplayUnit.BATCH,
    ])('maps %s display unit to unit stock unit', (unit) => {
      expect(mapBatchDisplayUnitToStockUnit(unit)).toBe(StockUnit.UNIT);
    });
  });

  describe('gramsToLegacyPackageWeightKg', () => {
    it('converts grams to kilograms', () => {
      expect(gramsToLegacyPackageWeightKg(440)).toBe(0.44);
      expect(gramsToLegacyPackageWeightKg(1000)).toBe(1);
    });
  });
});
