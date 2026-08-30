import { describe, expect, it } from 'vitest';

import {
  formatBatchSizeForApi,
  recipeFormDraftSchema,
  recipeFormGeneralSchema,
  validateRecipeFormDraft,
  validateRecipeFormGeneral,
} from './recipeForm.schema';

const validGeneralValues = {
  categoryId: 'cat-1',
  recipeType: 'FINAL_PRODUCT' as const,
  name: 'Arroz pilaf',
  finishedProductId: 'supply-1',
  batchSize: '10.5',
  batchDisplayUnit: 'PORTION' as const,
  packageWeightGrams: '440',
  expectedYield: '10',
  expectedYieldUnit: 'porciones',
  estimatedHours: '1',
  estimatedMinutes: '30',
  operationCenter: 'PLANT' as const,
  locationIds: [] as string[],
  technicalResponsible: 'CHEF' as const,
  allergens: ['GLUTEN' as const],
  notes: 'Notas de prueba',
};

describe('recipeFormDraftSchema', () => {
  it('acepta borrador con categoría y nombre', () => {
    const result = recipeFormDraftSchema.safeParse({
      categoryId: 'cat-1',
      name: 'Borrador',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza borrador sin categoría', () => {
    const result = validateRecipeFormDraft({ categoryId: '', name: 'Borrador', notes: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.categoryId).toBeTruthy();
    }
  });
});

describe('recipeFormGeneralSchema', () => {
  it('acepta valores válidos del paso general', () => {
    const result = recipeFormGeneralSchema.safeParse(validGeneralValues);
    expect(result.success).toBe(true);
  });

  it('valida tamaño de lote con hasta 2 decimales', () => {
    const invalid = recipeFormGeneralSchema.safeParse({
      ...validGeneralValues,
      batchSize: '10.555',
    });
    expect(invalid.success).toBe(false);

    const valid = recipeFormGeneralSchema.safeParse({
      ...validGeneralValues,
      batchSize: '10.55',
    });
    expect(valid.success).toBe(true);
  });

  it('valida gramos enteros positivos', () => {
    const invalid = recipeFormGeneralSchema.safeParse({
      ...validGeneralValues,
      packageWeightGrams: '12.5',
    });
    expect(invalid.success).toBe(false);
  });

  it('exige sedes cuando el centro es Sede', () => {
    const result = validateRecipeFormGeneral({
      ...validGeneralValues,
      operationCenter: 'LOCATION',
      locationIds: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.locationIds).toContain('Selecciona al menos una sede');
    }
  });

  it('acepta múltiples sedes para centro Sede', () => {
    const result = validateRecipeFormGeneral({
      ...validGeneralValues,
      operationCenter: 'LOCATION',
      locationIds: ['loc-1', 'loc-2'],
    });
    expect(result.success).toBe(true);
  });

  it('limita el nombre a 150 caracteres', () => {
    const result = validateRecipeFormGeneral({
      ...validGeneralValues,
      name: 'a'.repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it('limita notas a 500 caracteres', () => {
    const result = validateRecipeFormGeneral({
      ...validGeneralValues,
      notes: 'n'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('formatBatchSizeForApi', () => {
  it('formatea a 3 decimales para la API', () => {
    expect(formatBatchSizeForApi('10.5')).toBe('10.500');
  });
});
