import { useQuery } from '@tanstack/react-query';

import { getPlantWorkstations } from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';

export function usePlantWorkstations(enabled = true) {
  return useQuery({
    queryKey: plantKeys.workstations(),
    queryFn: getPlantWorkstations,
    enabled,
    select: (stations) =>
      stations
        .filter((station) => station.isActive)
        .map((station) => ({ id: station.id, name: station.name })),
  });
}
