import { useMutation, useQueryClient } from '@tanstack/react-query';

import { registerAttendanceEntry, registerAttendanceExit } from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type { AttendanceEntryInput, AttendanceExitInput } from '../types/attendance.types';

export function useRegisterAttendanceEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceEntryInput) => registerAttendanceEntry(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useRegisterAttendanceExitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceExitInput) => registerAttendanceExit(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
