import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updatePlantWorkstation } from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';

import { supervisorKeys } from '../api/supervisor.keys';
import type { WorkstationFormValues } from '../types';

function toUpdateInput(values: WorkstationFormValues) {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description.trim() || undefined,
    location: values.location.trim() || undefined,
    isActive: values.isActive,
  };
}

export function useUpdateWorkstation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WorkstationFormValues }) =>
      updatePlantWorkstation(id, toUpdateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supervisorKeys.stations() });
      void queryClient.invalidateQueries({ queryKey: supervisorKeys.overview() });
      void queryClient.invalidateQueries({ queryKey: plantKeys.workstations() });
    },
  });
}
