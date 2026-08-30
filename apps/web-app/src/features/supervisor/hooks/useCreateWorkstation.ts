import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createPlantWorkstation } from '@/api/plant/plant.api';
import { plantKeys } from '@/api/plant/plant.keys';

import { supervisorKeys } from '../api/supervisor.keys';
import type { WorkstationFormValues } from '../types';

function toCreateInput(values: WorkstationFormValues) {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description.trim() || undefined,
    location: values.location.trim() || undefined,
  };
}

export function useCreateWorkstation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: WorkstationFormValues) => createPlantWorkstation(toCreateInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supervisorKeys.stations() });
      void queryClient.invalidateQueries({ queryKey: supervisorKeys.overview() });
      void queryClient.invalidateQueries({ queryKey: plantKeys.workstations() });
    },
  });
}
