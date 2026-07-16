import { useMemo, useState } from 'react';

import type {
  TurnoEstadoFilter,
  TurnoJornada,
  TurnoTipo,
  TurnosListQuery,
} from '../types/turnos.types';

export const TURNOS_PAGE_SIZE_OPTIONS = [8, 20, 50, 100] as const;

export type TurnosPageSize = (typeof TURNOS_PAGE_SIZE_OPTIONS)[number];

export interface TurnosFiltersState {
  estadoDraft: TurnoEstadoFilter;
  estadoApplied: TurnoEstadoFilter;
  search: string;
  nombre: string;
  sigla: string;
  tipo: '' | TurnoTipo;
  jornada: '' | TurnoJornada;
  page: number;
  pageSize: TurnosPageSize;
}

function estadoToQuery(estado: TurnoEstadoFilter): boolean | undefined {
  if (estado === 'active') return true;
  if (estado === 'inactive') return false;
  return undefined;
}

export function useTurnosFilters(initialPageSize: TurnosPageSize = 8) {
  const [state, setState] = useState<TurnosFiltersState>({
    estadoDraft: 'all',
    estadoApplied: 'all',
    search: '',
    nombre: '',
    sigla: '',
    tipo: '',
    jornada: '',
    page: 1,
    pageSize: initialPageSize,
  });

  const queryFilters = useMemo<TurnosListQuery>(() => {
    const filters: TurnosListQuery = {
      page: state.page,
      limit: state.pageSize,
      estado: estadoToQuery(state.estadoApplied),
    };

    if (state.search.trim()) filters.search = state.search.trim();
    if (state.nombre.trim()) filters.nombre = state.nombre.trim();
    if (state.sigla.trim()) filters.sigla = state.sigla.trim();
    if (state.tipo) filters.tipo = state.tipo;
    if (state.jornada) filters.jornada = state.jornada;

    return filters;
  }, [state]);

  const exportFilters = useMemo(
    () => ({
      estado: queryFilters.estado,
      search: queryFilters.search,
      nombre: queryFilters.nombre,
      sigla: queryFilters.sigla,
      tipo: queryFilters.tipo,
      jornada: queryFilters.jornada,
    }),
    [queryFilters],
  );

  const setSearch = (search: string) => {
    setState((current) => ({ ...current, search, page: 1 }));
  };

  const setEstadoDraft = (estadoDraft: TurnoEstadoFilter) => {
    setState((current) => ({ ...current, estadoDraft }));
  };

  const applyEstadoFilter = () => {
    setState((current) => ({
      ...current,
      estadoApplied: current.estadoDraft,
      page: 1,
    }));
  };

  const setColumnFilter = (key: 'nombre' | 'sigla' | 'tipo' | 'jornada', value: string) => {
    setState((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const setPage = (page: number) => {
    setState((current) => ({ ...current, page }));
  };

  const setPageSize = (pageSize: TurnosPageSize) => {
    setState((current) => ({ ...current, pageSize, page: 1 }));
  };

  return {
    state,
    queryFilters,
    exportFilters,
    setSearch,
    setEstadoDraft,
    applyEstadoFilter,
    setColumnFilter,
    setPage,
    setPageSize,
  };
}
