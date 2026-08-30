import { describe, expect, it } from 'vitest';

import {
  getEquipmentOptionsForPhaseType,
  sanitizeEquipmentForPhaseType,
} from '@/features/recetas/constants/recipePhaseCatalogs';
import {
  buildPhasesTimeWarning,
  calculatePhasesTotalMinutes,
  clearConditionalPhaseFields,
  combineHoursAndMinutes,
} from '@/features/recetas/mappers/phases.mapper';
import type { RecipePhaseFormRow } from '@/features/recetas/types';
import { validateRecipePhaseRows } from '@/features/recetas/validation/recipePhases.schema';

function buildValidRow(overrides: Partial<RecipePhaseFormRow> = {}): RecipePhaseFormRow {
  return {
    id: 'phase-1',
    order: 1,
    phaseType: 'COOKING',
    standardMinutes: 30,
    timeHours: '0',
    timeMinutes: '30',
    compositionLineIds: ['line-1'],
    equipment: ['OVEN'],
    finalWeight: '1.50',
    requiredPackaging: '',
    shelfLifeValue: '',
    shelfLifeUnit: '',
    storageCondition: '',
    rejectionCriteria: ['TEMPERATURE'],
    expanded: true,
    ...overrides,
  };
}

describe('recipePhases.schema', () => {
  it('requires at least one phase', () => {
    const result = validateRecipePhaseRows([]);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/al menos una fase/i);
  });

  it('requires phase type and positive standard minutes', () => {
    const result = validateRecipePhaseRows([
      {
        phaseType: '',
        standardMinutes: 0,
        timeHours: '',
        timeMinutes: '',
        compositionLineIds: [],
        finalWeight: '',
        requiredPackaging: '',
        shelfLifeValue: '',
        shelfLifeUnit: '',
        storageCondition: '',
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['phases.0.phaseType']).toBeDefined();
    expect(result.fieldErrors?.['phases.0.standardMinutes']).toBeDefined();
  });

  it('requires packaging text for PACKAGING phase', () => {
    const result = validateRecipePhaseRows([
      {
        phaseType: 'PACKAGING',
        standardMinutes: 15,
        timeHours: '0',
        timeMinutes: '15',
        compositionLineIds: ['line-1'],
        finalWeight: '',
        requiredPackaging: '',
        shelfLifeValue: '',
        shelfLifeUnit: '',
        storageCondition: '',
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['phases.0.requiredPackaging']).toBeDefined();
  });

  it('requires shelf life and storage condition for COLD_STORAGE phase', () => {
    const result = validateRecipePhaseRows([
      {
        phaseType: 'COLD_STORAGE',
        standardMinutes: 20,
        timeHours: '0',
        timeMinutes: '20',
        compositionLineIds: ['line-1'],
        finalWeight: '',
        requiredPackaging: '',
        shelfLifeValue: '',
        shelfLifeUnit: '',
        storageCondition: '',
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.['phases.0.shelfLifeValue']).toBeDefined();
    expect(result.fieldErrors?.['phases.0.storageCondition']).toBeDefined();
  });

  it('requires at least one phase with composition insumos', () => {
    const result = validateRecipePhaseRows([
      {
        phaseType: 'COOKING',
        standardMinutes: 20,
        timeHours: '0',
        timeMinutes: '20',
        compositionLineIds: [],
        finalWeight: '',
        requiredPackaging: '',
        shelfLifeValue: '',
        shelfLifeUnit: '',
        storageCondition: '',
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/insumos/i);
  });
});

describe('phases.mapper helpers', () => {
  it('combines hours and minutes', () => {
    expect(combineHoursAndMinutes('1', '15')).toBe(75);
  });

  it('calculates total minutes across phases', () => {
    expect(
      calculatePhasesTotalMinutes([
        buildValidRow({ standardMinutes: 20 }),
        buildValidRow({ id: 'phase-2', standardMinutes: 10 }),
      ]),
    ).toBe(30);
  });

  it('warns when total minutes diverges from estimated time', () => {
    expect(buildPhasesTimeWarning(120, 60)).toMatch(/difiere/i);
    expect(buildPhasesTimeWarning(62, 60)).toBeNull();
  });
});

describe('recipePhaseCatalogs', () => {
  it('filters equipment by phase type and keeps gramera global', () => {
    const cooking = getEquipmentOptionsForPhaseType('COOKING').map((option) => option.value);
    expect(cooking).toContain('OVEN');
    expect(cooking).toContain('GRAM_SCALE');
    expect(cooking).not.toContain('ULTRA_FREEZER');
  });

  it('clears invalid equipment when phase type changes', () => {
    const sanitized = sanitizeEquipmentForPhaseType('CHILLING', ['OVEN', 'GRAM_SCALE']);
    expect(sanitized).toEqual(['GRAM_SCALE']);
  });

  it('clears conditional fields when phase type changes', () => {
    const next = clearConditionalPhaseFields(
      buildValidRow({
        phaseType: 'PACKAGING',
        requiredPackaging: 'Bolsa',
        shelfLifeValue: '2',
        shelfLifeUnit: 'DAYS',
        storageCondition: 'REFRIGERATED',
      }),
      'COOKING',
    );

    expect(next.requiredPackaging).toBe('');
    expect(next.shelfLifeValue).toBe('');
    expect(next.storageCondition).toBe('');
  });
});
