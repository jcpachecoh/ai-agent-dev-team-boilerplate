import type {
  PlantRecipeCompositionLine,
  RecipeComponentType,
  RecipeUsageUnit,
} from '@/api/plant/types';
import type { SupplyItemApi } from '@/features/inventario/types';

import type { RecipeCompositionRow } from '../types';

const OUNCE_TO_GRAMS = 28.3495;

export function calculateShrinkagePercent(gross: string, net: string): string {
  const grossValue = Number.parseFloat(gross.replace(',', '.'));
  const netValue = Number.parseFloat(net.replace(',', '.'));
  if (!Number.isFinite(grossValue) || grossValue <= 0 || !Number.isFinite(netValue)) {
    return '0.00';
  }
  const percent = ((grossValue - netValue) / grossValue) * 100;
  return percent.toFixed(2);
}

export function convertNetQuantityToGrams(quantity: string, unit: RecipeUsageUnit): number {
  const value = Number.parseFloat(quantity.replace(',', '.'));
  if (!Number.isFinite(value)) {
    return 0;
  }
  switch (unit) {
    case 'GRAM':
      return value;
    case 'KILOGRAM':
      return value * 1000;
    case 'OUNCE':
      return value * OUNCE_TO_GRAMS;
    default:
      return value;
  }
}

export function calculateTotalNetGrams(rows: RecipeCompositionRow[]): number {
  return rows.reduce((sum, row) => {
    if (!row.usageUnit || !row.netQuantity) {
      return sum;
    }
    return sum + convertNetQuantityToGrams(row.netQuantity, row.usageUnit);
  }, 0);
}

export function buildBatchWeightWarning(
  totalNetGrams: number,
  packageWeightGrams: string,
): string | null {
  const batchWeight = Number.parseInt(packageWeightGrams.trim(), 10);
  if (!Number.isFinite(batchWeight) || batchWeight <= 0) {
    return null;
  }
  if (totalNetGrams > batchWeight) {
    return `El total neto (${totalNetGrams.toFixed(1)} g) supera el peso por lote (${batchWeight} g). Revisa las cantidades.`;
  }
  return null;
}

export function createEmptyCompositionRow(sortOrder: number): RecipeCompositionRow {
  return {
    id: crypto.randomUUID(),
    supplyItemId: '',
    supplyItemCode: '',
    supplyItemName: '',
    componentType: '',
    usageUnit: '',
    grossQuantity: '',
    netQuantity: '',
    sortOrder,
    persisted: false,
  };
}

export function duplicateCompositionRow(
  row: RecipeCompositionRow,
  sortOrder: number,
): RecipeCompositionRow {
  return {
    ...row,
    id: crypto.randomUUID(),
    sortOrder,
    persisted: false,
  };
}

export function mapSupplyItemToCompositionFields(
  item: SupplyItemApi,
): Pick<
  RecipeCompositionRow,
  'supplyItemId' | 'supplyItemCode' | 'supplyItemName' | 'supplyItemBaseUnit'
> {
  return {
    supplyItemId: item.id,
    supplyItemCode: item.codigoInterno,
    supplyItemName: item.nombre,
    supplyItemBaseUnit: item.unidadBase,
  };
}

export function mapPlantCompositionToRow(line: PlantRecipeCompositionLine): RecipeCompositionRow {
  return {
    id: line.id,
    supplyItemId: line.supplyItemId,
    supplyItemCode: line.supplyItemCode,
    supplyItemName: line.supplyItemName,
    componentType: line.componentType,
    usageUnit: line.usageUnit,
    grossQuantity: line.grossQuantity,
    netQuantity: line.netQuantity,
    sortOrder: line.sortOrder,
    persisted: true,
  };
}

export function mapCompositionRowsToApi(rows: RecipeCompositionRow[]): Array<{
  supplyItemId: string;
  componentType: RecipeComponentType;
  usageUnit: RecipeUsageUnit;
  grossQuantity: string;
  netQuantity: string;
  sortOrder: number;
}> {
  return rows.map((row, index) => ({
    supplyItemId: row.supplyItemId,
    componentType: row.componentType as RecipeComponentType,
    usageUnit: row.usageUnit as RecipeUsageUnit,
    grossQuantity: row.grossQuantity.replace(',', '.'),
    netQuantity: row.netQuantity.replace(',', '.'),
    sortOrder: index,
  }));
}

export function isUsageUnitMismatch(row: RecipeCompositionRow): boolean {
  if (!row.usageUnit || !row.supplyItemBaseUnit) {
    return false;
  }
  const usageToBase: Record<RecipeUsageUnit, string> = {
    GRAM: 'GRAMS',
    MILLILITER: 'ML',
    UNIT: 'UNIT',
    KILOGRAM: 'KILOGRAMS',
    LITER: 'LITERS',
    OUNCE: 'GRAMS',
  };
  return usageToBase[row.usageUnit] !== row.supplyItemBaseUnit;
}

export function formatCompositionTotalLabel(totalGrams: number): string {
  return `${totalGrams.toFixed(3).replace(/\.?0+$/, '')} g`;
}
