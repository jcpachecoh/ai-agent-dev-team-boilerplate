import { graphqlRequest } from '@/lib/graphql-client';

import { MARCACIONES_POR_EMPLEADO_QUERY } from './mobile-attendance.graphql';
import type {
  MarcacionesPorEmpleadoInput,
  MobileAttendanceConnection,
} from '../types/mobile-attendance.types';

export async function fetchMarcacionesPorEmpleado(
  input: MarcacionesPorEmpleadoInput,
): Promise<MobileAttendanceConnection> {
  const data = await graphqlRequest<{ marcacionesPorEmpleado: MobileAttendanceConnection }>(
    MARCACIONES_POR_EMPLEADO_QUERY,
    { input },
  );
  return data.marcacionesPorEmpleado;
}
