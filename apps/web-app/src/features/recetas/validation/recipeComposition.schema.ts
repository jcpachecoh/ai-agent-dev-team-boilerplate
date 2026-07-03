import { z } from 'zod';

const componentTypeSchema = z.enum([
  'INGREDIENT',
  'SUB_RECIPE',
  'PACKAGING',
  'SAUCE',
  'TOPPING',
  'DECORATION',
]);

const usageUnitSchema = z.enum(['GRAM', 'MILLILITER', 'UNIT', 'KILOGRAM', 'LITER', 'OUNCE']);

const quantitySchema = z
  .string()
  .trim()
  .refine((value) => /^\d+(\.\d{1,3})?$/.test(value.replace(',', '.')), {
    message: 'Debe ser un número positivo con hasta 3 decimales',
  })
  .refine((value) => Number.parseFloat(value.replace(',', '.')) > 0, {
    message: 'Debe ser mayor a cero',
  });

export const recipeCompositionRowSchema = z
  .object({
    supplyItemId: z.string().trim().min(1, 'Selecciona un insumo'),
    componentType: componentTypeSchema,
    usageUnit: usageUnitSchema,
    grossQuantity: quantitySchema,
    netQuantity: quantitySchema,
  })
  .superRefine((row, ctx) => {
    const gross = Number.parseFloat(row.grossQuantity.replace(',', '.'));
    const net = Number.parseFloat(row.netQuantity.replace(',', '.'));
    if (net > gross) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La cantidad neta no puede ser mayor que la bruta',
        path: ['netQuantity'],
      });
    }
  });

export const recipeCompositionSchema = z
  .array(recipeCompositionRowSchema)
  .min(1, 'Agrega al menos un componente a la composición');

export type RecipeCompositionFormRow = z.infer<typeof recipeCompositionRowSchema>;

export function validateRecipeComposition(rows: RecipeCompositionFormRow[]): {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
} {
  const result = recipeCompositionSchema.safeParse(rows);
  if (result.success) {
    return { success: true };
  }

  const fieldErrors: Record<string, string> = {};
  let message = 'Revisa los componentes de la composición';

  for (const issue of result.error.issues) {
    if (issue.path.length === 0) {
      message = issue.message;
      continue;
    }
    const index = issue.path[0];
    const field = issue.path[1];
    if (typeof index === 'number' && typeof field === 'string') {
      fieldErrors[`composition.${index}.${field}`] = issue.message;
    }
  }

  return { success: false, message, fieldErrors };
}

export function validateRecipeCompositionRows(
  rows: Array<{
    supplyItemId: string;
    componentType: string;
    usageUnit: string;
    grossQuantity: string;
    netQuantity: string;
  }>,
): ReturnType<typeof validateRecipeComposition> {
  return validateRecipeComposition(
    rows.map((row) => ({
      supplyItemId: row.supplyItemId,
      componentType: row.componentType as RecipeCompositionFormRow['componentType'],
      usageUnit: row.usageUnit as RecipeCompositionFormRow['usageUnit'],
      grossQuantity: row.grossQuantity,
      netQuantity: row.netQuantity,
    })),
  );
}
