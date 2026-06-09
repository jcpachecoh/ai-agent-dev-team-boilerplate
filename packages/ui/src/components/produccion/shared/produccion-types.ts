import type { ReactNode } from 'react';

export type ProduccionTheme = 'light' | 'dark';
export type ProduccionSize = 'sm' | 'md' | 'xl';
export type ProduccionStationStatus = 'active' | 'inactive' | 'maintenance';
export type ProduccionRecipeStatus = 'published' | 'draft' | 'archived';
export type ProduccionStatus = ProduccionStationStatus | ProduccionRecipeStatus;
export type ProduccionStationTone =
  | 'preparation'
  | 'processing'
  | 'cooking'
  | 'cooling'
  | 'packing'
  | 'maturation'
  | 'sanitation'
  | 'neutral';
export type ProduccionAccent = 'gold' | 'teal' | 'warning' | 'danger' | 'info' | 'muted';

export interface ProduccionTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ProduccionFilterChip {
  id: string;
  label: string;
}

export interface ProduccionKpiItem {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  accent?: ProduccionAccent;
  icon?: ReactNode;
}

export interface ProduccionStationRowData {
  code: string;
  name: string;
  location: string;
  type: string;
  typeTone?: ProduccionStationTone;
  capacityLabel: string;
  status: ProduccionStationStatus;
  recipeCountLabel?: string;
  selected?: boolean;
}

export interface ProduccionAssignedRecipe {
  name: string;
  phaseLabel?: string;
}

export interface ProduccionStationDetailData extends ProduccionStationRowData {
  description?: string;
  assignedRecipes?: ProduccionAssignedRecipe[];
}

export interface ProduccionRecipeRowData {
  name: string;
  category?: string;
  productName: string;
  batchSizeLabel: string;
  phaseCount: number;
  totalTimeLabel: string;
  versionLabel: string;
  status: ProduccionRecipeStatus;
  selected?: boolean;
}

export interface ProduccionRecipeMetric {
  label: string;
  value: string;
}

export interface ProduccionPhaseData {
  order: number;
  name: string;
  stationLabel: string;
  durationLabel: string;
  operatorsLabel?: string;
  requiresQA?: boolean;
}

export interface ProduccionRecipeDetailData extends ProduccionRecipeRowData {
  metrics?: ProduccionRecipeMetric[];
  phases?: ProduccionPhaseData[];
}

export type ProduccionOrderPriority = 'normal' | 'alta' | 'urgente';
export type ProduccionEfficiencyStatus = 'normal' | 'warning' | 'critical';
export type ProduccionSeverityLevel = 'medio' | 'alto' | 'critico';

export interface ProduccionPlantOperatorAvatar {
  initials: string;
  tone?: 'gold' | 'teal' | 'info' | 'warning' | 'danger';
}

export interface ProduccionPlantStationData {
  id?: string;
  code: string;
  name: string;
  subtitle?: string;
  orderNumber?: string;
  productName?: string;
  priority?: ProduccionOrderPriority;
  quantityLabel?: string;
  phaseLabel?: string;
  progress?: number;
  efficiencyStatus?: ProduccionEfficiencyStatus;
  timerLabel?: string;
  severity?: ProduccionSeverityLevel;
  operators?: ProduccionPlantOperatorAvatar[];
  operatorCountLabel?: string;
  status?: ProduccionStationStatus;
  selected?: boolean;
}

export interface ProduccionPlantAlarmItem {
  code: string;
  severity: ProduccionSeverityLevel;
  title: string;
  stationLabel: string;
  timeLabel: string;
}

export interface ProduccionPlantNewsItem {
  title: string;
  detail: string;
  timeLabel: string;
  statusLabel?: string;
  statusTone?: 'warning' | 'success' | 'muted';
}

export type ProduccionPlantLivePhaseStatus = 'completed' | 'in_progress' | 'pending';

export interface ProduccionPlantLivePhase {
  order: number;
  name: string;
  status: ProduccionPlantLivePhaseStatus;
}

export interface ProduccionPlantLiveOperator {
  initials: string;
  name: string;
  roleLabel: string;
  timerLabel: string;
  tone?: 'gold' | 'teal' | 'info' | 'warning' | 'danger';
}

export interface ProduccionPlantStationLiveDetailData {
  code: string;
  name: string;
  productName?: string;
  timerLabel: string;
  standardTimeLabel?: string;
  progress?: number;
  efficiencyStatus?: ProduccionEfficiencyStatus;
  exceeded?: boolean;
  phases?: ProduccionPlantLivePhase[];
  orderNumber?: string;
  orderId?: string;
  goalLabel?: string;
  operators?: ProduccionPlantLiveOperator[];
}

export interface ProduccionOrderQueueItem {
  orderNumber: string;
  recipeName: string;
  stationLabel: string;
  etaLabel?: string;
  statusLabel?: string;
}

export interface ProduccionOperatorActivityItem {
  operatorName: string;
  stationLabel: string;
  actionLabel: string;
  timeLabel?: string;
}
