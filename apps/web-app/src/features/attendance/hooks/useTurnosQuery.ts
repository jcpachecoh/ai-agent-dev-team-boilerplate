import { useQuery } from '@tanstack/react-query';

import { listTurnos } from '../api/turnos.api';
import { attendanceKeys } from '../api/queryKeys';
import type { TurnosListQuery } from '../types/turnos.types';

export function useTurnosQuery(filters: TurnosListQuery) {
  return useQuery({
    queryKey: attendanceKeys.turnos.list(filters),
    queryFn: () => listTurnos(filters),
    placeholderData: (previous) => previous,
  });
}
