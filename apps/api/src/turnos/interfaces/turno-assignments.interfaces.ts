import type { TurnoAssignmentType, TurnoJornada, TurnoTipo } from '@prisma/client';

export type AssignmentCellType = 'ASSIGNED' | 'REST' | 'BASE';

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

export interface WeeklyAssignmentsResult {
  weekStart: string;
  dates: string[];
  colaboradores: WeeklyColaborador[];
  pagination: WeeklyAssignmentsPagination;
}

export interface ListWeeklyAssignmentsOptions {
  weekStart: Date;
  search?: string;
  field?: 'nombre' | 'documento';
  page?: number;
  limit?: number;
  allowedLocationIds?: string[] | null;
}

export interface TurnoAssignmentRecord {
  id: string;
  tenantId: string;
  turnoId: string | null;
  employeeId: string;
  workDate: Date;
  type: TurnoAssignmentType;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  turno: AssignmentTurnoSummary | null;
}

export interface EmployeeScopeInfo {
  id: string;
  locationId: string;
  isActive: boolean;
}

export interface TurnoScopeInfo {
  id: string;
  nombre: string;
  sigla: string;
  horaInicio: string;
  horaFin: string;
  jornada: TurnoJornada;
  tipo: TurnoTipo;
  estado: boolean;
}

export interface AssignAssignmentData {
  employeeId: string;
  workDate: Date;
  type: TurnoAssignmentType;
  turnoId: string | null;
}

export interface AssignmentAuditChangeSet {
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}

export interface ActorContext {
  userId: string;
  roleCode: string;
}

export interface ActorScope extends ActorContext {
  tenantId: string;
  /** null = sin restricción de sede (admin/nómina); array = sedes permitidas (supervisor/manager) */
  allowedLocationIds: string[] | null;
}

export interface ITurnoAssignmentsRepository {
  findActiveEmployeesPage(
    tenantId: string,
    options: {
      search?: string;
      field?: 'nombre' | 'documento';
      page: number;
      limit: number;
      allowedLocationIds?: string[] | null;
    },
  ): Promise<{
    employees: Array<{
      id: string;
      userId: string;
      nombre: string;
      documento: string;
      locationId: string;
    }>;
    total: number;
  }>;
  findAssignmentsForEmployeesInRange(
    tenantId: string,
    employeeIds: string[],
    from: Date,
    to: Date,
  ): Promise<TurnoAssignmentRecord[]>;
  findById(tenantId: string, id: string): Promise<TurnoAssignmentRecord | null>;
  findByEmployeeAndDate(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<TurnoAssignmentRecord | null>;
  findEmployeeScope(tenantId: string, employeeId: string): Promise<EmployeeScopeInfo | null>;
  findTurnoScope(tenantId: string, turnoId: string): Promise<TurnoScopeInfo | null>;
  upsertWithAudit(
    tenantId: string,
    data: AssignAssignmentData,
    actorUserId: string,
    auditChanges: AssignmentAuditChangeSet,
  ): Promise<TurnoAssignmentRecord>;
  deleteWithAudit(
    tenantId: string,
    id: string,
    actorUserId: string,
    auditChanges: AssignmentAuditChangeSet,
  ): Promise<void>;
}

export interface ITurnoAssignmentsService {
  getWeekly(
    tenantId: string,
    actor: ActorContext,
    options: Omit<ListWeeklyAssignmentsOptions, 'allowedLocationIds'>,
  ): Promise<WeeklyAssignmentsResult>;
  assign(
    tenantId: string,
    actor: ActorContext,
    input: { employeeId: string; workDate: string; turnoId?: string; type?: TurnoAssignmentType },
  ): Promise<TurnoAssignmentRecord>;
  remove(tenantId: string, actor: ActorContext, id: string): Promise<void>;
}
