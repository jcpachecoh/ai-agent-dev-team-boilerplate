export type TurnoTipo = 'PERMANENTE' | 'VARIABLE';
export type TurnoJornada = 'DIURNO' | 'NOCTURNO' | 'MIXTO';

export type TurnoEstadoFilter = 'active' | 'inactive' | 'all';

export interface Turno {
  id: string;
  locationId: string;
  nombre: string;
  sigla: string;
  tipo: TurnoTipo;
  jornada: TurnoJornada;
  horaInicio: string;
  horaFin: string;
  daysOfWeek: number[];
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TurnosListQuery {
  estado?: boolean;
  search?: string;
  nombre?: string;
  sigla?: string;
  tipo?: TurnoTipo;
  jornada?: TurnoJornada;
  page?: number;
  limit?: number;
}

export interface TurnosPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TurnosListResponse {
  data: Turno[];
  pagination: TurnosPagination;
}

export interface CreateTurnoInput {
  locationId: string;
  nombre: string;
  sigla: string;
  tipo: TurnoTipo;
  jornada: TurnoJornada;
  horaInicio: string;
  horaFin: string;
  daysOfWeek: number[];
}

export type UpdateTurnoInput = CreateTurnoInput;

export interface TurnoFormValues {
  locationId: string;
  nombre: string;
  sigla: string;
  tipo: TurnoTipo;
  jornada: TurnoJornada;
  horaInicio: string;
  horaFin: string;
  daysOfWeek: number[];
}

export interface TurnoConflictErrorBody {
  message?: string;
  affectedCount?: number;
}
