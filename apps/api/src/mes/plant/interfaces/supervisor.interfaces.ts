import type { AlarmSeverity, ProductionPriority } from '@prisma/client';

export interface SupervisorOverviewKpi {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  accent?: 'teal' | 'gold' | 'danger' | 'warning' | 'info' | 'muted';
}

export interface SupervisorOverviewOperator {
  initials: string;
  tone?: 'gold' | 'teal' | 'info' | 'warning' | 'danger';
}

export interface SupervisorOverviewStationCard {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  orderNumber?: string;
  productName?: string;
  priority?: 'normal' | 'alta' | 'urgente';
  quantityLabel?: string;
  phaseLabel?: string;
  progress?: number;
  efficiencyStatus?: 'normal' | 'warning' | 'critical';
  timerLabel?: string;
  severity?: 'medio' | 'alto' | 'critico';
  operators?: SupervisorOverviewOperator[];
  operatorCountLabel?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface SupervisorOverviewAlarm {
  id: string;
  code: string;
  severity: 'medio' | 'alto' | 'critico';
  title: string;
  stationLabel: string;
  timeLabel: string;
}

export interface SupervisorOverviewNewsItem {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  statusLabel?: string;
  statusTone?: 'warning' | 'success' | 'muted';
}

export interface SupervisorOverviewResponse {
  kpis: SupervisorOverviewKpi[];
  stations: SupervisorOverviewStationCard[];
  alarms: SupervisorOverviewAlarm[];
  news: SupervisorOverviewNewsItem[];
  activeStationCount: number;
}

export interface SupervisorAssignedRecipe {
  recipeId: string;
  recipeName: string;
  phaseName: string;
}

export interface SupervisorStationMasterRow {
  id: string;
  code: string;
  name: string;
  location: string;
  description: string | null;
  type: string;
  typeTone:
    | 'preparation'
    | 'processing'
    | 'cooking'
    | 'cooling'
    | 'packing'
    | 'maturation'
    | 'sanitation'
    | 'neutral';
  capacityLabel: string;
  status: 'active' | 'inactive' | 'maintenance';
  recipeCountLabel: string;
  phaseCount: number;
  assignedRecipes: SupervisorAssignedRecipe[];
}

export interface SupervisorStationsResponse {
  stations: SupervisorStationMasterRow[];
}

export interface SupervisorStationLivePhase {
  order: number;
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface SupervisorStationLiveOperator {
  initials: string;
  name: string;
  roleLabel: string;
  timerLabel: string;
  tone?: 'gold' | 'teal' | 'info' | 'warning' | 'danger';
}

export interface SupervisorStationLiveDetailResponse {
  stationId: string;
  code: string;
  name: string;
  productName?: string;
  timerLabel: string;
  standardTimeLabel?: string;
  progress?: number;
  efficiencyStatus?: 'normal' | 'warning' | 'critical';
  exceeded?: boolean;
  phases?: SupervisorStationLivePhase[];
  orderNumber?: string;
  orderId?: string;
  goalLabel?: string;
  operators?: SupervisorStationLiveOperator[];
}

export type IncidentSeverityUi = 'medio' | 'alto' | 'critico';

export function mapAlarmSeverityToUi(severity: AlarmSeverity): IncidentSeverityUi {
  switch (severity) {
    case 'CRITICAL':
      return 'critico';
    case 'WARNING':
      return 'alto';
    default:
      return 'medio';
  }
}

export function mapPriorityToUi(priority: ProductionPriority): 'normal' | 'alta' | 'urgente' {
  switch (priority) {
    case 'HIGH':
      return 'alta';
    case 'URGENT':
      return 'urgente';
    default:
      return 'normal';
  }
}

export function mapEfficiencyStatus(progressPct: number): 'normal' | 'warning' | 'critical' {
  if (progressPct > 100) return 'critical';
  if (progressPct >= 80) return 'warning';
  return 'normal';
}
