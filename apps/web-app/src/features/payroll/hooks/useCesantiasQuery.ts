import { useQuery } from '@tanstack/react-query';

import {
  getCesantiasAlertSummary,
  getCesantiasExportAvailability,
  listCesantias,
} from '../api/cesantias.client';
import { payrollKeys } from '../api/queryKeys';
import type { ListCesantiasFilters } from '../types/cesantias.types';

export function useCesantiasQuery(filters: ListCesantiasFilters, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.cesantiasList(filters),
    queryFn: () => listCesantias(filters),
    enabled,
  });
}

export function useCesantiasAlertSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: payrollKeys.cesantiasAlertSummary(),
    queryFn: () => getCesantiasAlertSummary(),
    enabled,
  });
}

/**
 * OS-588 (fase 4, revisión previa a commit) — única fuente de verdad para habilitar los
 * botones de descarga: consume `GET /cesantias/export-availability`, que ya aplica la
 * misma regla de estados exportables que usa el backend para armar los archivos
 * (`EXPORTABLE_CESANTIAS_STATUSES`). El frontend no vuelve a decidir qué estados cuentan.
 */
export function useCesantiasExportAvailabilityQuery(year: number, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.cesantiasExportAvailability(year),
    queryFn: () => getCesantiasExportAvailability(year),
    enabled,
  });
}
