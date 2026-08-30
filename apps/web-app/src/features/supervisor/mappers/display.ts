import type {
  ProduccionEfficiencyStatus,
  ProduccionPlantStationData,
  ProduccionStationDetailData,
} from '@restopsiq/ui';

import type {
  SupervisorStationFilter,
  SupervisorStationMaster,
  SupervisorStationProgressFilter,
  SupervisorStationStatusFilter,
  WorkstationFormValues,
} from '../types';

function resolveEfficiencyStatus(
  progress: number,
  efficiencyStatus?: ProduccionEfficiencyStatus,
): ProduccionEfficiencyStatus {
  if (efficiencyStatus) return efficiencyStatus;
  if (progress > 100) return 'critical';
  if (progress >= 80) return 'warning';
  return 'normal';
}

export function filterSupervisorMapStations(
  stations: ProduccionPlantStationData[],
  statusFilter: SupervisorStationStatusFilter,
  progressFilter: SupervisorStationProgressFilter,
): ProduccionPlantStationData[] {
  return stations.filter((station) => {
    if (statusFilter === 'active' && station.status !== 'active') return false;
    if (statusFilter === 'inactive' && station.status === 'active') return false;

    if (progressFilter !== 'all') {
      const efficiency = resolveEfficiencyStatus(station.progress ?? 0, station.efficiencyStatus);
      if (efficiency !== progressFilter) return false;
    }

    return true;
  });
}

export function filterSupervisorStations(
  rows: SupervisorStationMaster[],
  filter: SupervisorStationFilter,
): SupervisorStationMaster[] {
  if (filter === 'all') return rows;
  if (filter === 'maintenance') return rows.filter((row) => row.status === 'maintenance');
  if (filter === 'inactive') return rows.filter((row) => row.status === 'inactive');
  return rows.filter((row) => row.status === 'active');
}

export function toStationDetail(station: SupervisorStationMaster): ProduccionStationDetailData {
  return {
    code: station.code,
    name: station.name,
    location: station.location,
    description: station.description ?? undefined,
    type: station.type,
    typeTone: station.typeTone,
    capacityLabel: station.capacityLabel,
    status: station.status,
    recipeCountLabel: station.recipeCountLabel,
    assignedRecipes: station.assignedRecipes.map((recipe) => ({
      name: recipe.recipeName,
      phaseLabel: recipe.phaseName,
    })),
  };
}

export function toWorkstationFormValues(station: SupervisorStationMaster): WorkstationFormValues {
  return {
    name: station.name,
    code: station.code,
    description: station.description ?? '',
    location: station.location,
    isActive: station.status === 'active',
  };
}
