import { useMutation, useQueryClient } from '@tanstack/react-query';

import { attendanceKeys } from '../api/queryKeys';
import {
  assignTurno,
  deleteAssignment,
  getAssignmentTemplate,
  importAssignments,
} from '../api/turno-assignments.api';
import type { BulkTemplateQuery } from '../types/turno-assignments.types';

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

export function useDownloadAssignmentTemplateMutation() {
  return useMutation({
    mutationFn: (query: BulkTemplateQuery) => getAssignmentTemplate(query),
  });
}

export function useImportAssignmentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importAssignments(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.turnoAssignments.all() });
    },
  });
}
