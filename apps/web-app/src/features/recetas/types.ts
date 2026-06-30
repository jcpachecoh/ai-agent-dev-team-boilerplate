import type {
  BatchDisplayUnit,
  OperationCenter,
  RecipeAllergen,
  RecipeLifecycleStatus,
  RecipeType,
  TechnicalResponsible,
} from '@/api/plant/types';

export type RecetaStatus = 'active' | 'inactive';
export type RecipeListStatusFilter = 'all' | RecetaStatus | 'trial';
export type RecetaResult = 'ok' | 'warning' | 'failed';

export type {
  RecipeType,
  BatchDisplayUnit,
  RecipeLifecycleStatus,
  OperationCenter,
  TechnicalResponsible,
  RecipeAllergen,
};

export const RECIPE_TYPE_OPTIONS: Array<{ value: RecipeType; label: string }> = [
  { value: 'FINAL_PRODUCT', label: 'Producto final' },
  { value: 'SUB_RECIPE', label: 'Subreceta' },
  { value: 'BASE_PRODUCTION', label: 'Producción base' },
  { value: 'COMBO', label: 'Combo' },
  { value: 'SIDE', label: 'Acompañamiento' },
];

export const BATCH_DISPLAY_UNIT_OPTIONS: Array<{ value: BatchDisplayUnit; label: string }> = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'PORTION', label: 'Porción' },
  { value: 'KILOGRAM', label: 'Kilo' },
  { value: 'LITER', label: 'Litro' },
  { value: 'TRAY', label: 'Bandeja' },
  { value: 'BATCH', label: 'Lote' },
];

export const OPERATION_CENTER_OPTIONS: Array<{ value: OperationCenter; label: string }> = [
  { value: 'PLANT', label: 'Planta' },
  { value: 'LOCATION', label: 'Sede' },
  { value: 'ALL', label: 'Todas' },
];

export const TECHNICAL_RESPONSIBLE_OPTIONS: Array<{ value: TechnicalResponsible; label: string }> =
  [
    { value: 'CHEF', label: 'Chef' },
    { value: 'PRODUCTION', label: 'Producción' },
    { value: 'QUALITY', label: 'Calidad' },
  ];

export const RECIPE_ALLERGEN_OPTIONS: Array<{ value: RecipeAllergen; label: string }> = [
  { value: 'GLUTEN', label: 'Gluten' },
  { value: 'DAIRY', label: 'Lácteos' },
  { value: 'EGG', label: 'Huevo' },
  { value: 'NUTS', label: 'Frutos secos' },
];

export const LIFECYCLE_STATUS_LABELS: Record<RecipeLifecycleStatus, string> = {
  TRIAL: 'Prueba',
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
};

export interface RecipeListItem {
  id: string;
  code: string;
  name: string;
  category: string;
  durationMin: number;
  phases: number;
  version: number;
  versionLabel: string;
  updatedAt: string;
  status: RecetaStatus;
  lifecycleStatus: RecipeLifecycleStatus;
  statusLabel: string;
}

export interface ProcessRow {
  recipeId: string;
  code: string;
  name: string;
  category: string;
  phases: number;
  duration: string;
  status: string;
  result: RecetaResult;
  health: number;
  lastValidation: string;
}

export interface RecipeCategoryFormValues {
  nombre: string;
  descripcion: string;
  isActive: boolean;
}

export interface ProcessViewData {
  rows: ProcessRow[];
  stats: {
    total: number;
    validated: number;
    inProgress: number;
    failed: number;
    health: number;
  };
}

export interface RecipeFormGeneralValues {
  categoryId: string;
  recipeType: RecipeType | '';
  name: string;
  finishedProductId: string;
  batchSize: string;
  batchDisplayUnit: BatchDisplayUnit | '';
  packageWeightGrams: string;
  expectedYield: string;
  expectedYieldUnit: string;
  estimatedHours: string;
  estimatedMinutes: string;
  operationCenter: OperationCenter | '';
  locationIds: string[];
  technicalResponsible: TechnicalResponsible | '';
  allergens: RecipeAllergen[];
  notes: string;
}

export function mapLifecycleToRecetaStatus(status: RecipeLifecycleStatus): RecetaStatus {
  return status === 'ACTIVE' ? 'active' : 'inactive';
}

export function getRecipeTypeLabel(value: RecipeType | null | undefined): string {
  if (!value) {
    return '—';
  }
  return RECIPE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getBatchDisplayUnitLabel(value: BatchDisplayUnit | null | undefined): string {
  if (!value) {
    return '—';
  }
  return BATCH_DISPLAY_UNIT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getOperationCenterLabel(value: OperationCenter | null | undefined): string {
  if (!value) {
    return '—';
  }
  return OPERATION_CENTER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getTechnicalResponsibleLabel(
  value: TechnicalResponsible | null | undefined,
): string {
  if (!value) {
    return '—';
  }
  return TECHNICAL_RESPONSIBLE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getAllergenLabels(allergens: RecipeAllergen[] | null | undefined): string {
  if (!allergens?.length) {
    return 'Ninguno';
  }
  return allergens
    .map(
      (allergen) =>
        RECIPE_ALLERGEN_OPTIONS.find((option) => option.value === allergen)?.label ?? allergen,
    )
    .join(', ');
}

export function parseEstimatedTotalMinutes(hours: string, minutes: string): number {
  const parsedHours = Number.parseInt(hours.trim() || '0', 10);
  const parsedMinutes = Number.parseInt(minutes.trim() || '0', 10);
  const safeHours = Number.isNaN(parsedHours) || parsedHours < 0 ? 0 : parsedHours;
  const safeMinutes = Number.isNaN(parsedMinutes) || parsedMinutes < 0 ? 0 : parsedMinutes;
  const total = safeHours * 60 + safeMinutes;
  return Math.max(1, total);
}

export function splitEstimatedMinutes(totalMinutes: number): { hours: string; minutes: string } {
  const safeTotal = Math.max(1, totalMinutes);
  const hours = Math.floor(safeTotal / 60);
  const minutes = safeTotal % 60;
  return {
    hours: String(hours),
    minutes: String(minutes),
  };
}

export type RecipeComponentType =
  | 'INGREDIENT'
  | 'SUB_RECIPE'
  | 'PACKAGING'
  | 'SAUCE'
  | 'TOPPING'
  | 'DECORATION';

export type RecipeUsageUnit = 'GRAM' | 'MILLILITER' | 'UNIT' | 'KILOGRAM' | 'LITER' | 'OUNCE';

export const RECIPE_COMPONENT_TYPE_OPTIONS: Array<{ value: RecipeComponentType; label: string }> = [
  { value: 'INGREDIENT', label: 'Ingrediente' },
  { value: 'SUB_RECIPE', label: 'Subreceta' },
  { value: 'PACKAGING', label: 'Empaque' },
  { value: 'SAUCE', label: 'Salsa' },
  { value: 'TOPPING', label: 'Topping' },
  { value: 'DECORATION', label: 'Decoración' },
];

export const RECIPE_USAGE_UNIT_OPTIONS: Array<{ value: RecipeUsageUnit; label: string }> = [
  { value: 'GRAM', label: 'Gramo' },
  { value: 'MILLILITER', label: 'Mililitro' },
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KILOGRAM', label: 'Kilo' },
  { value: 'LITER', label: 'Litro' },
  { value: 'OUNCE', label: 'Onza' },
];

export interface RecipeCompositionRow {
  id: string;
  supplyItemId: string;
  supplyItemCode: string;
  supplyItemName: string;
  supplyItemBaseUnit?: import('@/features/inventario/types').StockUnit;
  componentType: RecipeComponentType | '';
  usageUnit: RecipeUsageUnit | '';
  grossQuantity: string;
  netQuantity: string;
  sortOrder: number;
  persisted?: boolean;
}
