import { useMutation, useQueryClient } from '@tanstack/react-query';

import { attendanceKeys } from '../api/queryKeys';
import { assignTurno, deleteAssignment } from '../api/turno-assignments.api';

export function useAssignTurnoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignTurno,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.turnoAssignments.all() });
    },
  });
}

export function useDeleteAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.turnoAssignments.all() });
    },
  });
}
