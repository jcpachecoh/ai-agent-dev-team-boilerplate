import type { FieldOpsSize, FieldOpsTheme } from '../../shared/field-ops-types';

export type PlantLayoutMode = '1x1' | '1x2' | '2x2';

export type PlantWorkstationStatus = 'empty' | 'pending' | 'in_progress' | 'paused' | 'incident';

export type PlantWorkstationDensity = 'full' | 'compact';

export type PlantWorkstationTab = 'process' | 'incidents';

export interface PlantWorkstationIngredient {
  id: string;
  name: string;
  quantity: string;
}

export type PlantRecipePhaseStatus = 'completed' | 'current' | 'pending';

export interface PlantRecipePhaseIngredient extends PlantWorkstationIngredient {
  supplier?: string;
  stockWarning?: boolean;
}

export interface PlantRecipePhase {
  id: string;
  index: number;
  name: string;
  durationMinutes: number;
  ingredients: PlantRecipePhaseIngredient[];
  instruction?: string;
  stockIssue?: boolean;
}

export interface PlantRecipeDetail {
  recipeName: string;
  batchSize: string;
  stationId: string;
  phases: PlantRecipePhase[];
}

export function resolveRecipePhaseStatuses(
  phases: PlantRecipePhase[],
  currentPhaseIndex: number,
): Array<PlantRecipePhase & { status: PlantRecipePhaseStatus }> {
  return phases.map((phase) => ({
    ...phase,
    status:
      phase.index < currentPhaseIndex
        ? 'completed'
        : phase.index === currentPhaseIndex
          ? 'current'
          : 'pending',
  }));
}

export interface PlantWorkstationSnapshot {
  orderId: string;
  productName: string;
  recipeName: string;
  phaseName: string;
  phaseIndex: number;
  phaseTotal: number;
  stationId: string;
  priority?: 'urgent' | 'normal';
  operatorName?: string;
  ingredients: PlantWorkstationIngredient[];
  standardDurationMs: number;
}

export interface PlantAvailableOrder extends PlantWorkstationSnapshot {
  status: Exclude<PlantWorkstationStatus, 'empty'>;
}

export interface PlantStatusCounts {
  inProgress: number;
  paused: number;
  incidents: number;
  pending: number;
}

export interface PlantLocationOption {
  id: string;
  name: string;
  code?: string | null;
  city?: string | null;
  address?: string | null;
}

export interface PlantDashboardThemeProps {
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export const PLANT_STATUS_LABELS: Record<Exclude<PlantWorkstationStatus, 'empty'>, string> = {
  in_progress: 'EN PROCESO',
  paused: 'PAUSADO',
  pending: 'PENDIENTE',
  incident: 'NOVEDAD',
};

export const PLANT_STATUS_ACCENT: Record<Exclude<PlantWorkstationStatus, 'empty'>, string> = {
  in_progress: '#2ec4a0',
  paused: '#f0c040',
  pending: '#3b82f6',
  incident: '#e05a44',
};

export function formatPlantElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatPlantStandard(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function layoutModeCellCount(mode: PlantLayoutMode): number {
  if (mode === '1x1') return 1;
  if (mode === '1x2') return 2;
  return 4;
}
