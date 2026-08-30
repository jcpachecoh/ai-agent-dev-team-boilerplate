import { useMutation, useQueryClient } from '@tanstack/react-query';

import { attendanceKeys } from '../api/queryKeys';
import { createTurno, exportTurnosExcel, updateTurno, updateTurnoEstado } from '../api/turnos.api';
import type { CreateTurnoInput, TurnosListQuery, UpdateTurnoInput } from '../types/turnos.types';

export function useCreateTurnoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTurnoInput) => createTurno(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.turnos.all() });
    },
  });
}

export function useUpdateTurnoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTurnoInput }) => updateTurno(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.turnos.all() });
    },
  });
}

export function useUpdateTurnoEstadoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: boolean }) => updateTurnoEstado(id, estado),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.turnos.all() });
    },
  });
}

export function useExportTurnosMutation() {
  return useMutation({
    mutationFn: (filters: Omit<TurnosListQuery, 'page' | 'limit'>) => exportTurnosExcel(filters),
  });
}
