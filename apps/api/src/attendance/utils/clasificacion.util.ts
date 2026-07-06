import { LaborClassification } from '@prisma/client';

import type { AttendanceClasificacion } from '../interfaces/attendance.interfaces';

// Mapeo compartido OS-578 (monitor-summary) / OS-548 (control-panel).
export function resolveClasificacionFilter(
  clasificacion?: AttendanceClasificacion,
): LaborClassification[] | undefined {
  if (!clasificacion || clasificacion === 'todos') {
    return undefined;
  }
  if (clasificacion === 'administrativo') {
    return [LaborClassification.ADMINISTRATIVO];
  }
  if (clasificacion === 'operaciones') {
    return [LaborClassification.COCINA, LaborClassification.SERVICIO];
  }
  return undefined;
}
