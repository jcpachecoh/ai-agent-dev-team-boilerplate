import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  emailAttendanceCollaboratorsExport,
  exportAttendanceCollaborators,
  patchAttendanceCollaboratorPortal,
} from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type {
  AttendanceCollaboratorEmailExportInput,
  AttendanceCollaboratorExportFormat,
  AttendanceCollaboratorsFilters,
} from '../types/attendance.types';

export function useTogglePortalWorkerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeDetailsId, enabled }: { employeeDetailsId: string; enabled: boolean }) =>
      patchAttendanceCollaboratorPortal(employeeDetailsId, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'collaborators'] });
    },
  });
}

export function useExportAttendanceCollaboratorsMutation() {
  return useMutation({
    mutationFn: ({
      format,
      filters,
    }: {
      format: AttendanceCollaboratorExportFormat;
      filters: AttendanceCollaboratorsFilters;
    }) => exportAttendanceCollaborators(format, filters),
  });
}

export function useEmailAttendanceCollaboratorsExportMutation() {
  return useMutation({
    mutationFn: (input: AttendanceCollaboratorEmailExportInput) =>
      emailAttendanceCollaboratorsExport(input),
  });
}
