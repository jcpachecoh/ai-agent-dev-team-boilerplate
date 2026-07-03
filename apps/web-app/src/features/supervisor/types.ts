import type {
  ProduccionKpiItem,
  ProduccionPlantAlarmItem,
  ProduccionPlantNewsItem,
  ProduccionPlantStationData,
  ProduccionPlantStationLiveDetailData,
  ProduccionStationRowData,
} from '@restopsiq/ui';

export interface SupervisorOverviewResponse {
  kpis: ProduccionKpiItem[];
  stations: ProduccionPlantStationData[];
  alarms: ProduccionPlantAlarmItem[];
  news: ProduccionPlantNewsItem[];
  activeStationCount: number;
}

export type SupervisorStationLiveDetail = ProduccionPlantStationLiveDetailData & {
  stationId: string;
};

export interface SupervisorAssignedRecipe {
  recipeId: string;
  recipeName: string;
  phaseName: string;
}

export interface SupervisorStationMaster {
  id: string;
  code: string;
  name: string;
  location: string;
  description: string | null;
  type: string;
  typeTone: ProduccionStationRowData['typeTone'];
  capacityLabel: string;
  status: ProduccionStationRowData['status'];
  recipeCountLabel: string;
  phaseCount: number;
  assignedRecipes: SupervisorAssignedRecipe[];
}

export interface SupervisorStationsResponse {
  stations: SupervisorStationMaster[];
}

export type SupervisorStationFilter = 'all' | 'active' | 'inactive' | 'maintenance';

export type SupervisorStationStatusFilter = 'all' | 'active' | 'inactive';

export type SupervisorStationProgressFilter = 'all' | 'normal' | 'warning' | 'critical';

export interface WorkstationFormValues {
  name: string;
  code: string;
  description: string;
  location: string;
  isActive?: boolean;
}
