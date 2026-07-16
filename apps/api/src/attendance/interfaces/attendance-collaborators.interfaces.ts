import type { EmployeeContractType, LaborClassification } from '@prisma/client';
import type {
  ActorContext,
  AssignmentCellType,
  AssignmentTurnoSummary,
} from '../../turnos/interfaces/turno-assignments.interfaces';

export type { ActorContext };

/** Valor del filtro `laborClassification` de la query pública (mapea a uno o varios valores del enum Prisma). */
export type LaborClassificationFilter = 'administrativo' | 'operaciones';

/** Columnas ordenables — mismas que ya eran sorteables client-side antes de la paginación real (empleado-columns.ts). */
export type CollaboratorSortColumn = 'employee' | 'role' | 'hireDate';
export type CollaboratorSortDirection = 'asc' | 'desc';

export interface ListCollaboratorsFilters {
  tenantId: string;
  search?: string;
  positionId?: string;
  contractType?: EmployeeContractType;
  area?: string;
  locationId?: string;
  supervisorUserId?: string;
  laborClassification?: LaborClassificationFilter;
  /** Preserva el filtro Estado ya existente en pantalla (all/active/inactive). deletedAt:null siempre se aplica, independientemente de este valor. */
  status?: 'all' | 'active' | 'inactive';
  /** Preserva el ordenamiento por columna ya existente en pantalla (antes client-side, ahora en la query real). */
  sortBy?: CollaboratorSortColumn;
  sortDir?: CollaboratorSortDirection;
  page: number;
  pageSize: number;
  /** null = sin restricción de sede (OWNER/SUPER_ADMIN/NOMINA); array = sedes permitidas (SUPERVISOR/MANAGER). */
  allowedLocationIds: string[] | null;
  /**
   * OS-550 follow-up — cargos subordinados del `positionId` del supervisor filtrado
   * (`EmployeePositionSupervisor`). `null` = sin restricción por cargo (no se filtró por
   * supervisor, o el supervisor no tiene cargo/jerarquía configurada — fallback a solo sede,
   * mismo comportamiento que antes de esta jerarquía). Array (incluso vacío) = restringe a
   * esos cargos.
   */
  allowedPositionIds: string[] | null;
}

export interface CollaboratorRecord {
  id: string;
  userId: string;
  /** null para empleados con costCenter = ROTANTE (CONN-06) — sin sede fija en ficha. */
  locationId: string | null;
  locationName: string | null;
  name: string;
  primerApellido: string | null;
  segundoApellido: string | null;
  cedula: string;
  email: string;
  positionId: string | null;
  positionName: string;
  area: string;
  contractType: EmployeeContractType;
  laborClassification: LaborClassification;
  isActive: boolean;
  portalWorkerEnabled: boolean;
}

export interface CollaboratorsPage {
  items: CollaboratorRecord[];
  total: number;
  /** Conteos agregados respetando todos los filtros activos (incluido `status`) — para las tarjetas de resumen del listado, no solo la página actual. */
  activeTotal: number;
  inactiveTotal: number;
}

export interface CollaboratorSupervisorSummary {
  id: string;
  name: string;
  email: string | null;
}

export interface CollaboratorTodayShift {
  type: AssignmentCellType;
  turno: AssignmentTurnoSummary | null;
}

export interface AttendanceCollaboratorItem extends CollaboratorRecord {
  supervisors: CollaboratorSupervisorSummary[];
  /**
   * OS-550 follow-up — título(s) del/los cargo(s) que supervisa(n) el cargo de este
   * colaborador (`EmployeePositionSupervisor`), unidos por ", " si hay más de uno.
   * `null` si el colaborador no tiene cargo asignado o el cargo no tiene jerarquía
   * configurada en el organigrama. No es un jefe directo individual — es el/los cargo(s)
   * supervisor(es), consistente con la decisión de no modelar supervisor por persona.
   */
  supervisorPositionName: string | null;
  todayShift: CollaboratorTodayShift;
}

/** Fila plana para exportación (Excel/PDF) — formateo ya resuelto una sola vez, reutilizado por ambos generadores. */
export interface CollaboratorExportRow {
  cedula: string;
  primerApellido: string;
  segundoApellido: string;
  name: string;
  positionName: string;
  area: string;
  supervisorsLabel: string;
  contractType: string;
  turnoLabel: string;
  portalLabel: string;
}

export type CollaboratorExportFormat = 'excel' | 'pdf';

export interface AuditHistoryEntry {
  id: string;
  action: string;
  actorName: string | null;
  createdAt: Date;
  oldValue: unknown;
  newValue: unknown;
}

export interface AttendanceCollaboratorsResult {
  items: AttendanceCollaboratorItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface SupervisorOption {
  id: string;
  name: string;
  email: string | null;
}

export interface IAttendanceCollaboratorsRepository {
  findPage(filters: ListCollaboratorsFilters): Promise<CollaboratorsPage>;
  findMatchingIdsBySearch(tenantId: string, search: string): Promise<string[]>;
  findSupervisorsForLocations(
    tenantId: string,
    locationIds: string[],
  ): Promise<Map<string, CollaboratorSupervisorSummary[]>>;
  findTodayAssignments(
    tenantId: string,
    employeeIds: string[],
    today: Date,
  ): Promise<Map<string, CollaboratorTodayShift>>;
  findSupervisorUser(
    tenantId: string,
    userId: string,
  ): Promise<{ id: string; roleCode: string; positionId: string | null } | null>;
  findSupervisorOptions(
    tenantId: string,
    allowedLocationIds: string[] | null,
  ): Promise<SupervisorOption[]>;
  findEmployeeForPortalToggle(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<{ id: string; portalWorkerEnabled: boolean } | null>;
  updatePortalWorkerEnabled(employeeDetailsId: string, enabled: boolean): Promise<void>;
  /** OS-550 follow-up — cargos que reportan directamente a `supervisorPositionId` (EmployeePositionSupervisor). */
  findSubordinatePositionIds(tenantId: string, supervisorPositionId: string): Promise<string[]>;
  /** OS-550 follow-up — título(s) del/los cargo(s) supervisor(es) de cada `positionId` dado, para la columna Supervisor. */
  findSupervisorPositionNamesByPosition(
    tenantId: string,
    positionIds: string[],
  ): Promise<Map<string, string>>;
}
