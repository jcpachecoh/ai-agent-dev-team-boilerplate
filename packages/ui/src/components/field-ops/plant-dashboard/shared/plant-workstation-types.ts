import type { FieldOpsSize, FieldOpsTheme } from '../../shared/field-ops-types';

export type PlantLayoutMode = '1x1' | '1x2' | '2x2';

export type PlantWorkstationStatus =
  | 'empty'
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'incident'
  | 'completed';

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
  stationName: string;
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
  /** Human-readable OP number for UI (e.g. OP0001-01). Falls back to orderId when omitted. */
  orderNumber?: string;
  productName: string;
  recipeName: string;
  phaseName: string;
  phaseIndex: number;
  phaseTotal: number;
  /** Workstation code for display (e.g. EST-02). */
  stationId: string;
  /** Workstation UUID for operator runtime API calls. */
  workStationId?: string;
  /** Active phase execution id for complete-step API calls. */
  currentStepId?: string;
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
  completed: 'TERMINADA',
};

export const PLANT_STATUS_ACCENT: Record<Exclude<PlantWorkstationStatus, 'empty'>, string> = {
  in_progress: '#2ec4a0',
  paused: '#f0c040',
  pending: '#3b82f6',
  incident: '#e05a44',
  completed: '#6b7280',
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

export type PlantIncidentType = 'QUALITY' | 'SAFETY' | 'EQUIPMENT' | 'OTHER';

export type PlantAlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface PlantSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export const PLANT_INCIDENT_TYPE_OPTIONS: PlantSelectOption<PlantIncidentType>[] = [
  { value: 'QUALITY', label: 'Calidad' },
  { value: 'SAFETY', label: 'Seguridad' },
  { value: 'EQUIPMENT', label: 'Equipo' },
  { value: 'OTHER', label: 'Otro' },
];

export const PLANT_ALARM_SEVERITY_OPTIONS: PlantSelectOption<PlantAlarmSeverity>[] = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Advertencia' },
  { value: 'CRITICAL', label: 'Crítica' },
];

export interface PlantBleDeviceSummary {
  deviceId: string;
  name?: string;
  rssi?: number;
}

export const PLANT_INCIDENT_ACCENT = '#e05a44';

export const PLANT_BLE_ACCENT = '#4dabf7';
