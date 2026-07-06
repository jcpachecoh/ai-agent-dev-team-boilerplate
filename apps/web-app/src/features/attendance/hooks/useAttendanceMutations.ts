import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createManualMarking,
  deleteManualMarking,
  registerAttendanceEntry,
  registerAttendanceExit,
  upsertAttendanceObservation,
} from '../api/attendance.client';
import { attendanceKeys } from '../api/queryKeys';
import type {
  AttendanceEntryInput,
  AttendanceExitInput,
  CreateManualMarkingInput,
  UpsertAttendanceObservationInput,
} from '../types/attendance.types';

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

export function useUpsertObservationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpsertAttendanceObservationInput }) =>
      upsertAttendanceObservation(userId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useCreateManualMarkingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: CreateManualMarkingInput }) =>
      createManualMarking(userId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useDeleteManualMarkingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => deleteManualMarking(logId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
