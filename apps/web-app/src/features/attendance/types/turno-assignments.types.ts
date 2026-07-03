import type { TurnoJornada } from './turnos.types';

export type AssignmentCellType = 'ASSIGNED' | 'REST' | 'BASE';
export type AssignmentType = 'ASSIGNED' | 'REST';

export interface AssignmentTurnoSummary {
  id: string;
  nombre: string;
  sigla: string;
  horaInicio: string;
  horaFin: string;
  jornada: TurnoJornada;
}

export interface WeeklyAssignmentCell {
  fecha: string;
  assignmentId?: string;
  type: AssignmentCellType;
  turno: AssignmentTurnoSummary | null;
  esDescanso: boolean;
  turnoBase: boolean;
}

export interface WeeklyColaborador {
  id: string;
  userId: string;
  nombre: string;
  documento: string;
  locationId: string;
  turnos: WeeklyAssignmentCell[];
}

export interface WeeklyAssignmentsPagination {
  total: number;
  page: number;
  limit: number;
}

export interface WeeklyAssignmentsResponse {
  weekStart: string;
  dates: string[];
  colaboradores: WeeklyColaborador[];
  pagination: WeeklyAssignmentsPagination;
}

export interface WeeklyAssignmentsQuery {
  weekStart: string;
  search?: string;
  field?: 'nombre' | 'documento';
  page?: number;
  limit?: number;
}

export interface AssignTurnoInput {
  employeeId: string;
  workDate: string;
  turnoId?: string;
  type?: AssignmentType;
}

export interface TurnoAssignmentResponse {
  id: string;
  employeeId: string;
  workDate: string;
  type: AssignmentType;
  turno: AssignmentTurnoSummary | null;
  createdAt: string;
  updatedAt: string;
}
