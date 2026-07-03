import type { PlantRecipePhase } from '@/api/plant/types';
import type { SyncPlantRecipePhaseInput } from '@/api/plant/plant.api';
import {
  getPhaseTypeLabel,
  inferPhaseTypeFromName,
  sanitizeEquipmentForPhaseType,
} from '@/features/recetas/constants/recipePhaseCatalogs';
import type {
  RecipeCompositionRow,
  RecipePhaseEquipment,
  RecipePhaseFormRow,
  RecipeProcessPhaseType,
  RecipeRejectionCriterion,
  ShelfLifeUnit,
  StorageCondition,
} from '@/features/recetas/types';

const PHASE_META_START = '\n<!--RECIPE_PHASE_META:';
const PHASE_META_END = '-->';

export interface PhaseDescriptionMeta {
  phaseType?: RecipeProcessPhaseType;
  equipment?: RecipePhaseEquipment[];
  finalWeight?: string | null;
  requiredPackaging?: string | null;
  shelfLifeValue?: number | null;
  shelfLifeUnit?: ShelfLifeUnit | null;
  storageCondition?: StorageCondition | null;
  rejectionCriteria?: RecipeRejectionCriterion[];
  compositionLineIds?: string[];
}

function mapLineUnitToApiUnit(
  usageUnit: RecipeCompositionRow['usageUnit'],
  baseUnit?: RecipeCompositionRow['supplyItemBaseUnit'],
): string {
  const map: Record<string, string> = {
    GRAM: 'GRAMS',
    KILOGRAM: 'KILOGRAMS',
    LITER: 'LITERS',
    MILLILITER: 'ML',
    UNIT: 'UNIT',
    OUNCE: 'GRAMS',
  };
  if (usageUnit && map[usageUnit]) {
    return map[usageUnit];
  }
  return baseUnit ?? 'UNIT';
}

export function splitMinutesToHoursParts(totalMinutes: number): {
  hours: string;
  minutes: string;
} {
  const safe = Math.max(0, totalMinutes);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return {
    hours: hours > 0 ? String(hours) : '',
    minutes: String(minutes),
  };
}

export function combineHoursAndMinutes(hours: string, minutes: string): number {
  const parsedHours = Number.parseInt(hours || '0', 10);
  const parsedMinutes = Number.parseInt(minutes || '0', 10);
  const safeHours = Number.isNaN(parsedHours) ? 0 : Math.max(0, parsedHours);
  const safeMinutes = Number.isNaN(parsedMinutes) ? 0 : Math.max(0, parsedMinutes);
  return safeHours * 60 + safeMinutes;
}

export function createEmptyPhaseRow(order: number): RecipePhaseFormRow {
  return {
    id: `phase-${Date.now()}-${order}`,
    order,
    phaseType: '',
    standardMinutes: 0,
    timeHours: '',
    timeMinutes: '',
    compositionLineIds: [],
    equipment: [],
    finalWeight: '',
    requiredPackaging: '',
    shelfLifeValue: '',
    shelfLifeUnit: '',
    storageCondition: '',
    rejectionCriteria: [],
    expanded: true,
  };
}

export function reorderPhaseRows(rows: RecipePhaseFormRow[]): RecipePhaseFormRow[] {
  return rows.map((row, index) => ({ ...row, order: index + 1 }));
}

export function calculatePhasesTotalMinutes(rows: RecipePhaseFormRow[]): number {
  return rows.reduce((sum, row) => sum + Math.max(0, row.standardMinutes), 0);
}

export function buildPhasesTimeWarning(
  totalMinutes: number,
  estimatedMinutes: number,
): string | null {
  if (estimatedMinutes <= 0) {
    return null;
  }
  const diff = Math.abs(totalMinutes - estimatedMinutes);
  const threshold = Math.max(15, Math.round(estimatedMinutes * 0.1));
  if (diff <= threshold) {
    return null;
  }
  return `El tiempo total de fases (${totalMinutes} min) difiere del tiempo estimado del paso 1 (${estimatedMinutes} min).`;
}

export function encodePhaseDescriptionMeta(meta: PhaseDescriptionMeta): string {
  return `${PHASE_META_START}${JSON.stringify(meta)}${PHASE_META_END}`;
}

export function parsePhaseDescriptionMeta(description: string | null | undefined): {
  base: string;
  meta: PhaseDescriptionMeta;
} {
  if (!description?.trim()) {
    return { base: '', meta: {} };
  }

  const start = description.indexOf(PHASE_META_START);
  if (start === -1) {
    return { base: description.trim(), meta: {} };
  }

  const end = description.indexOf(PHASE_META_END, start);
  if (end === -1) {
    return { base: description.trim(), meta: {} };
  }

  const json = description.slice(start + PHASE_META_START.length, end);
  let meta: PhaseDescriptionMeta = {};
  try {
    meta = JSON.parse(json) as PhaseDescriptionMeta;
  } catch {
    meta = {};
  }

  return {
    base: description.slice(0, start).trim(),
    meta,
  };
}

export function buildPhaseDescription(meta: PhaseDescriptionMeta): string {
  return encodePhaseDescriptionMeta(meta);
}

export function clearConditionalPhaseFields(
  row: RecipePhaseFormRow,
  nextPhaseType: RecipePhaseFormRow['phaseType'],
): RecipePhaseFormRow {
  const next: RecipePhaseFormRow = {
    ...row,
    phaseType: nextPhaseType,
    equipment: sanitizeEquipmentForPhaseType(nextPhaseType, row.equipment),
  };

  if (nextPhaseType !== 'PACKAGING') {
    next.requiredPackaging = '';
  }

  if (nextPhaseType !== 'COLD_STORAGE') {
    next.shelfLifeValue = '';
    next.shelfLifeUnit = '';
    next.storageCondition = '';
  }

  return next;
}

export function mapPlantPhaseToFormRow(
  phase: PlantRecipePhase,
  compositionRows: RecipeCompositionRow[],
): RecipePhaseFormRow {
  const { meta } = parsePhaseDescriptionMeta(phase.description);
  const phaseType = meta.phaseType ?? inferPhaseTypeFromName(phase.name);
  const timeParts = splitMinutesToHoursParts(phase.standardMinutes);

  const compositionLineIds =
    meta.compositionLineIds ??
    phase.inputs
      .map((input) => compositionRows.find((row) => row.supplyItemId === input.supplyItemId)?.id)
      .filter((id): id is string => Boolean(id));

  return {
    id: phase.id,
    order: phase.order,
    phaseType,
    standardMinutes: phase.standardMinutes,
    timeHours: timeParts.hours,
    timeMinutes: timeParts.minutes,
    compositionLineIds,
    equipment: meta.equipment ?? [],
    finalWeight: meta.finalWeight ?? '',
    requiredPackaging: meta.requiredPackaging ?? '',
    shelfLifeValue: meta.shelfLifeValue != null ? String(meta.shelfLifeValue) : '',
    shelfLifeUnit: meta.shelfLifeUnit ?? '',
    storageCondition: meta.storageCondition ?? '',
    rejectionCriteria: meta.rejectionCriteria ?? [],
    expanded: false,
    persisted: true,
  };
}

export function mapPlantPhasesToFormRows(
  phases: PlantRecipePhase[],
  compositionRows: RecipeCompositionRow[],
): RecipePhaseFormRow[] {
  return [...phases]
    .sort((left, right) => left.order - right.order)
    .map((phase) => mapPlantPhaseToFormRow(phase, compositionRows));
}

export function mapFormRowsToSyncInput(
  rows: RecipePhaseFormRow[],
  compositionRows: RecipeCompositionRow[],
  defaultWorkStationId: string,
): SyncPlantRecipePhaseInput[] {
  return rows.map((row, index) => {
    const phaseType = row.phaseType;
    const meta: PhaseDescriptionMeta = {
      phaseType: phaseType || undefined,
      equipment: row.equipment,
      finalWeight: row.finalWeight.trim() || null,
      requiredPackaging: phaseType === 'PACKAGING' ? row.requiredPackaging.trim() || null : null,
      shelfLifeValue:
        phaseType === 'COLD_STORAGE' && row.shelfLifeValue.trim()
          ? Number.parseInt(row.shelfLifeValue, 10)
          : null,
      shelfLifeUnit: phaseType === 'COLD_STORAGE' && row.shelfLifeUnit ? row.shelfLifeUnit : null,
      storageCondition:
        phaseType === 'COLD_STORAGE' && row.storageCondition ? row.storageCondition : null,
      rejectionCriteria: row.rejectionCriteria,
      compositionLineIds: row.compositionLineIds,
    };

    const compositionById = new Map(compositionRows.map((line) => [line.id, line]));

    return {
      id: row.id,
      title: getPhaseTypeLabel(phaseType) || `Fase ${index + 1}`,
      description: buildPhaseDescription(meta),
      durationMin: Math.max(1, row.standardMinutes),
      workStationId: defaultWorkStationId,
      validations: row.rejectionCriteria.map((criterion) => ({ label: criterion })),
      ingredients: row.compositionLineIds
        .map((lineId) => compositionById.get(lineId))
        .filter((line): line is RecipeCompositionRow => Boolean(line))
        .map((line) => ({
          supplyItemId: line.supplyItemId,
          quantityPerBatch: line.netQuantity || line.grossQuantity || '1',
          unit: mapLineUnitToApiUnit(line.usageUnit, line.supplyItemBaseUnit),
        })),
      phaseType: phaseType || undefined,
      equipment: row.equipment,
      finalWeight: row.finalWeight.trim() || null,
      requiredPackaging: meta.requiredPackaging,
      shelfLifeValue: meta.shelfLifeValue,
      shelfLifeUnit: meta.shelfLifeUnit,
      storageCondition: meta.storageCondition,
      rejectionCriteria: row.rejectionCriteria,
      compositionLineIds: row.compositionLineIds,
    };
  });
}
