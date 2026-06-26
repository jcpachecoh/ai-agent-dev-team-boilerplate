import { z } from 'zod';

import type { RecipeFormGeneralValues } from '../types';

const recipeTypeSchema = z.enum([
  'FINAL_PRODUCT',
  'SUB_RECIPE',
  'BASE_PRODUCTION',
  'COMBO',
  'SIDE',
]);

const batchDisplayUnitSchema = z.enum(['UNIT', 'PORTION', 'KILOGRAM', 'LITER', 'TRAY', 'BATCH']);

const operationCenterSchema = z.enum(['PLANT', 'LOCATION', 'ALL']);

const technicalResponsibleSchema = z.enum(['CHEF', 'PRODUCTION', 'QUALITY']);

const allergenSchema = z.enum(['GLUTEN', 'DAIRY', 'EGG', 'NUTS']);

const batchSizeSchema = z
  .string()
  .trim()
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value.replace(',', '.')), {
    message: 'El tamaño de lote debe ser un número positivo con hasta 2 decimales',
  })
  .refine((value) => Number.parseFloat(value.replace(',', '.')) > 0, {
    message: 'El tamaño de lote debe ser mayor a cero',
  });

const packageWeightGramsSchema = z
  .string()
  .trim()
  .refine((value) => /^\d+$/.test(value), {
    message: 'El peso por lote debe ser un entero positivo en gramos',
  })
  .refine((value) => Number.parseInt(value, 10) > 0, {
    message: 'El peso por lote debe ser mayor a cero',
  });

const expectedYieldSchema = z
  .string()
  .trim()
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value.replace(',', '.')), {
    message: 'El rendimiento esperado debe ser un número positivo',
  })
  .refine((value) => Number.parseFloat(value.replace(',', '.')) > 0, {
    message: 'El rendimiento esperado debe ser mayor a cero',
  });

function estimatedMinutesFromParts(hours: string, minutes: string): number {
  const parsedHours = Number.parseInt(hours.trim() || '0', 10);
  const parsedMinutes = Number.parseInt(minutes.trim() || '0', 10);
  const safeHours = Number.isNaN(parsedHours) || parsedHours < 0 ? 0 : parsedHours;
  const safeMinutes = Number.isNaN(parsedMinutes) || parsedMinutes < 0 ? 0 : parsedMinutes;
  return safeHours * 60 + safeMinutes;
}

export const recipeFormDraftSchema = z.object({
  categoryId: z.string().trim().min(1, 'La categoría es obligatoria'),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la receta es obligatorio')
    .max(150, 'Máximo 150 caracteres'),
  notes: z.string().max(500, 'Las notas no pueden superar 500 caracteres').optional(),
});

export const recipeFormGeneralSchema = z
  .object({
    categoryId: z.string().trim().min(1, 'La categoría es obligatoria'),
    recipeType: recipeTypeSchema,
    name: z
      .string()
      .trim()
      .min(1, 'El nombre de la receta es obligatorio')
      .max(150, 'Máximo 150 caracteres'),
    finishedProductId: z.string().trim().min(1, 'Selecciona un producto terminado (insumo)'),
    batchSize: batchSizeSchema,
    batchDisplayUnit: batchDisplayUnitSchema,
    packageWeightGrams: packageWeightGramsSchema,
    expectedYield: expectedYieldSchema,
    expectedYieldUnit: z.string().trim().min(1, 'La unidad de rendimiento es obligatoria'),
    estimatedHours: z.string().trim(),
    estimatedMinutes: z.string().trim(),
    operationCenter: operationCenterSchema,
    locationIds: z.array(z.string()),
    technicalResponsible: technicalResponsibleSchema,
    allergens: z.array(allergenSchema),
    notes: z.string().max(500, 'Las notas no pueden superar 500 caracteres'),
  })
  .superRefine((values, ctx) => {
    const totalMinutes = estimatedMinutesFromParts(values.estimatedHours, values.estimatedMinutes);
    if (totalMinutes < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El tiempo estimado debe ser al menos 1 minuto',
        path: ['estimatedMinutes'],
      });
    }

    if (values.operationCenter === 'LOCATION' && values.locationIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona al menos una sede',
        path: ['locationIds'],
      });
    }
  });

export type RecipeFormValidationResult =
  | { success: true }
  | {
      success: false;
      message: string;
      fieldErrors: Partial<Record<keyof RecipeFormGeneralValues, string>>;
    };

function zodErrorsToFieldMap(
  error: z.ZodError,
): Partial<Record<keyof RecipeFormGeneralValues, string>> {
  const fieldErrors: Partial<Record<keyof RecipeFormGeneralValues, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key as keyof RecipeFormGeneralValues]) {
      fieldErrors[key as keyof RecipeFormGeneralValues] = issue.message;
    }
  }
  return fieldErrors;
}

export function validateRecipeFormDraft(
  values: Pick<RecipeFormGeneralValues, 'categoryId' | 'name' | 'notes'>,
): RecipeFormValidationResult {
  const result = recipeFormDraftSchema.safeParse(values);
  if (result.success) {
    return { success: true };
  }
  const fieldErrors = zodErrorsToFieldMap(result.error);
  return {
    success: false,
    message: result.error.issues[0]?.message ?? 'Revisa los campos obligatorios',
    fieldErrors,
  };
}

export function validateRecipeFormGeneral(
  values: RecipeFormGeneralValues,
): RecipeFormValidationResult {
  const result = recipeFormGeneralSchema.safeParse(values);
  if (result.success) {
    return { success: true };
  }
  const fieldErrors = zodErrorsToFieldMap(result.error);
  return {
    success: false,
    message: result.error.issues[0]?.message ?? 'Revisa los campos obligatorios',
    fieldErrors,
  };
}

export function formatBatchSizeForApi(value: string): string {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return parsed.toFixed(3);
}

export function formatExpectedYieldForApi(value: string): string {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return parsed.toFixed(2);
}

export function mapBatchDisplayUnitToStockUnit(unit: string): string {
  switch (unit) {
    case 'KILOGRAM':
      return 'KILOGRAMS';
    case 'LITER':
      return 'LITERS';
    default:
      return 'UNIT';
  }
}
