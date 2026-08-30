import { z } from 'zod';

const phaseTypeSchema = z.enum([
  'DOSIFICATION_PREP',
  'COOKING',
  'CHILLING',
  'PACKAGING',
  'COLD_STORAGE',
]);

const phaseTypeFieldSchema = z
  .string()
  .trim()
  .min(1, 'Selecciona el tipo de fase')
  .pipe(phaseTypeSchema);

const shelfLifeUnitSchema = z.enum(['HOURS', 'DAYS', 'WEEKS']);
const storageConditionSchema = z.enum(['REFRIGERATED', 'FROZEN', 'AMBIENT']);

const decimalWeightSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value.replace(',', '.')), {
    message: 'Debe ser un número positivo con hasta 2 decimales',
  });

export const recipePhaseRowSchema = z
  .object({
    phaseType: phaseTypeFieldSchema,
    standardMinutes: z.number().int().min(1, 'El tiempo estándar debe ser al menos 1 minuto'),
    compositionLineIds: z.array(z.string()),
    finalWeight: decimalWeightSchema,
    requiredPackaging: z.string().trim().max(100, 'Máximo 100 caracteres'),
    shelfLifeValue: z.string().trim(),
    shelfLifeUnit: z.union([shelfLifeUnitSchema, z.literal('')]),
    storageCondition: z.union([storageConditionSchema, z.literal('')]),
  })
  .superRefine((row, ctx) => {
    if (row.phaseType === 'PACKAGING' && !row.requiredPackaging.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Empaque requerido es obligatorio para fase Empaque',
        path: ['requiredPackaging'],
      });
    }

    if (row.phaseType === 'COLD_STORAGE') {
      const value = Number.parseInt(row.shelfLifeValue, 10);
      if (!row.shelfLifeValue.trim() || Number.isNaN(value) || value <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vida útil es obligatoria para fase Almacén',
          path: ['shelfLifeValue'],
        });
      }
      if (!row.shelfLifeUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecciona la unidad de vida útil',
          path: ['shelfLifeUnit'],
        });
      }
      if (!row.storageCondition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Condición de almacenamiento es obligatoria',
          path: ['storageCondition'],
        });
      }
    }
  });

export const recipePhasesSchema = z
  .array(recipePhaseRowSchema)
  .min(1, 'Agrega al menos una fase al proceso')
  .superRefine((rows, ctx) => {
    const hasSupply = rows.some((row) => row.compositionLineIds.length > 0);
    if (!hasSupply) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Al menos una fase debe tener insumos de la composición',
      });
    }
  });

export type RecipePhaseFormValues = z.infer<typeof recipePhaseRowSchema>;

export function validateRecipePhases(
  rows: Array<{
    phaseType: string;
    standardMinutes: number;
    compositionLineIds: string[];
    finalWeight: string;
    requiredPackaging: string;
    shelfLifeValue: string;
    shelfLifeUnit: string;
    storageCondition: string;
  }>,
): {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
} {
  const result = recipePhasesSchema.safeParse(
    rows.map((row) => ({
      phaseType: row.phaseType,
      standardMinutes: row.standardMinutes,
      compositionLineIds: row.compositionLineIds,
      finalWeight: row.finalWeight,
      requiredPackaging: row.requiredPackaging,
      shelfLifeValue: row.shelfLifeValue,
      shelfLifeUnit: row.shelfLifeUnit,
      storageCondition: row.storageCondition,
    })),
  );

  if (result.success) {
    return { success: true };
  }

  const fieldErrors: Record<string, string> = {};
  let message = 'Revisa las fases del proceso';

  for (const issue of result.error.issues) {
    if (issue.path.length === 0) {
      message = issue.message;
      continue;
    }
    const index = issue.path[0];
    const field = issue.path[1];
    if (typeof index === 'number' && typeof field === 'string') {
      fieldErrors[`phases.${index}.${field}`] = issue.message;
    }
  }

  return { success: false, message, fieldErrors };
}

export function validateRecipePhaseRows(
  rows: Array<{
    phaseType: string;
    standardMinutes: number;
    timeHours: string;
    timeMinutes: string;
    compositionLineIds: string[];
    finalWeight: string;
    requiredPackaging: string;
    shelfLifeValue: string;
    shelfLifeUnit: string;
    storageCondition: string;
  }>,
): ReturnType<typeof validateRecipePhases> {
  return validateRecipePhases(
    rows.map((row) => ({
      phaseType: row.phaseType,
      standardMinutes: row.standardMinutes,
      compositionLineIds: row.compositionLineIds,
      finalWeight: row.finalWeight,
      requiredPackaging: row.requiredPackaging,
      shelfLifeValue: row.shelfLifeValue,
      shelfLifeUnit: row.shelfLifeUnit,
      storageCondition: row.storageCondition,
    })),
  );
}
