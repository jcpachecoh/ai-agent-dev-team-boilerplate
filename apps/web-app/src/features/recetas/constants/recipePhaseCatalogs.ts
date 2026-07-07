import type {
  RecipePhaseEquipment,
  RecipeProcessPhaseType,
  RecipeRejectionCriterion,
  ShelfLifeUnit,
  StorageCondition,
} from '@/features/recetas/types';

export const RECIPE_PROCESS_PHASE_TYPE_OPTIONS: Array<{
  value: RecipeProcessPhaseType;
  label: string;
}> = [
  { value: 'DOSIFICATION_PREP', label: 'Dosificación y alistamiento' },
  { value: 'COOKING', label: 'Cocción' },
  { value: 'CHILLING', label: 'Abatimiento' },
  { value: 'PACKAGING', label: 'Empaque' },
  { value: 'COLD_STORAGE', label: 'Almacén (Cuartos Fríos)' },
];

export const RECIPE_PHASE_EQUIPMENT_OPTIONS: Array<{
  value: RecipePhaseEquipment;
  label: string;
}> = [
  { value: 'OVEN', label: 'Horno' },
  { value: 'SMOKER', label: 'Ahumador' },
  { value: 'FRYERS', label: 'Freidoras' },
  { value: 'COMBI_OVEN', label: 'Horno Combi' },
  { value: 'TILTING_KETTLE', label: 'Marmita Basculante' },
  { value: 'PLANTAIN_PRESS', label: 'Pataconera' },
  { value: 'BLENDER', label: 'Licuadora' },
  { value: 'MIXER', label: 'Batidora' },
  { value: 'STOVE', label: 'Estufa' },
  { value: 'ULTRA_FREEZER', label: 'Ultracongelador' },
  { value: 'BOWL', label: 'Bowl' },
  { value: 'LADLE', label: 'Cucháron' },
  { value: 'KNIFE', label: 'Cuchillo' },
  { value: 'CLEAVER', label: 'Hachuela' },
  { value: 'POTATO_PEELER', label: 'Pelapapa' },
  { value: 'CUTTER', label: 'Cutter' },
  { value: 'COLD_ROOM', label: 'Cuartos Fríos' },
  { value: 'VACUUM_PACKAGING_MACHINE', label: 'Máquina de empaque al vacío' },
  { value: 'GRAM_SCALE', label: 'Gramera' },
];

export const RECIPE_REJECTION_CRITERION_OPTIONS: Array<{
  value: RecipeRejectionCriterion;
  label: string;
}> = [
  { value: 'TEMPERATURE', label: 'Temperatura' },
  { value: 'SMELL', label: 'Olor' },
  { value: 'COLOR', label: 'Color' },
  { value: 'WEIGHT', label: 'Peso' },
];

export const STORAGE_CONDITION_OPTIONS: Array<{ value: StorageCondition; label: string }> = [
  { value: 'REFRIGERATED', label: 'Refrigerado' },
  { value: 'FROZEN', label: 'Congelado' },
  { value: 'AMBIENT', label: 'Ambiente' },
];

export const SHELF_LIFE_UNIT_OPTIONS: Array<{ value: ShelfLifeUnit; label: string }> = [
  { value: 'HOURS', label: 'Horas' },
  { value: 'DAYS', label: 'Días' },
  { value: 'WEEKS', label: 'Semanas' },
];

const EQUIPMENT_BY_PHASE_TYPE: Record<RecipeProcessPhaseType, RecipePhaseEquipment[]> = {
  COOKING: [
    'OVEN',
    'SMOKER',
    'FRYERS',
    'COMBI_OVEN',
    'TILTING_KETTLE',
    'PLANTAIN_PRESS',
    'BLENDER',
    'MIXER',
    'STOVE',
  ],
  CHILLING: ['ULTRA_FREEZER'],
  DOSIFICATION_PREP: ['BOWL', 'LADLE', 'KNIFE', 'CLEAVER', 'POTATO_PEELER', 'CUTTER'],
  COLD_STORAGE: ['COLD_ROOM'],
  PACKAGING: ['VACUUM_PACKAGING_MACHINE'],
};

export const GLOBAL_PHASE_EQUIPMENT: RecipePhaseEquipment[] = ['GRAM_SCALE'];

export function getEquipmentOptionsForPhaseType(phaseType: RecipeProcessPhaseType | ''): Array<{
  value: RecipePhaseEquipment;
  label: string;
}> {
  if (!phaseType) {
    return RECIPE_PHASE_EQUIPMENT_OPTIONS.filter((option) =>
      GLOBAL_PHASE_EQUIPMENT.includes(option.value),
    );
  }

  const allowed = new Set([...EQUIPMENT_BY_PHASE_TYPE[phaseType], ...GLOBAL_PHASE_EQUIPMENT]);
  return RECIPE_PHASE_EQUIPMENT_OPTIONS.filter((option) => allowed.has(option.value));
}

export function sanitizeEquipmentForPhaseType(
  phaseType: RecipeProcessPhaseType | '',
  equipment: RecipePhaseEquipment[],
): RecipePhaseEquipment[] {
  const allowed = new Set(getEquipmentOptionsForPhaseType(phaseType).map((option) => option.value));
  return equipment.filter((item) => allowed.has(item));
}

export function inferPhaseTypeFromName(name: string): RecipeProcessPhaseType | '' {
  const normalized = name.trim().toLowerCase();
  const match = RECIPE_PROCESS_PHASE_TYPE_OPTIONS.find(
    (option) => option.label.toLowerCase() === normalized,
  );
  return match?.value ?? '';
}

export function getPhaseTypeLabel(phaseType: RecipeProcessPhaseType | ''): string {
  if (!phaseType) {
    return 'Sin tipo';
  }
  return (
    RECIPE_PROCESS_PHASE_TYPE_OPTIONS.find((option) => option.value === phaseType)?.label ??
    phaseType
  );
}
