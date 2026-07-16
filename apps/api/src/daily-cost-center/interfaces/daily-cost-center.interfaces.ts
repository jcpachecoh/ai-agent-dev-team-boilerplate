import { AssignmentSource, CostCenter } from '@prisma/client';

/**
 * CONN-06 / CONN-12 — Prioridad de fuente para la asignación diaria de sede (ROTANTE).
 * MANUAL > MARCACION_ASISTENCIA > TURNO_ASIGNADO
 *
 * - MANUAL nunca es sobrescrita por automático (CONN-06 D2).
 * - Marcación real prevalece sobre turno planificado (CONN-12 reunión / D4): el colaborador
 *   puede marcar en sede distinta a la planeada y esa sede alimenta el prorrateo.
 */
export const ASSIGNMENT_SOURCE_PRIORITY: Record<AssignmentSource, number> = {
  MANUAL: 3,
  MARCACION_ASISTENCIA: 2,
  TURNO_ASIGNADO: 1,
};

export interface UpsertDailyAssignmentInput {
  tenantId: string;
  employeeId: string;
  date: Date;
  locationId: string;
  shiftId?: string | null;
  source: AssignmentSource;
}

export interface DailyAssignmentRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  date: Date;
  locationId: string;
  shiftId: string | null;
  source: AssignmentSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyAssignmentWithLocation extends DailyAssignmentRecord {
  locationName: string;
}

export interface DailyAssignmentTenantFilters {
  employeeId?: string;
  locationId?: string;
  source?: AssignmentSource;
}

export interface PendingAssignmentDay {
  employeeId: string;
  date: Date;
}

export interface IDailyCostCenterRepository {
  upsertForDay(input: UpsertDailyAssignmentInput): Promise<DailyAssignmentRecord>;
  findByEmployeeAndDateRange(
    tenantId: string,
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<DailyAssignmentRecord[]>;
  findByTenantAndDateRange(
    tenantId: string,
    from: Date,
    to: Date,
    filters?: DailyAssignmentTenantFilters,
  ): Promise<DailyAssignmentWithLocation[]>;
  /** Días laborables del rango en que el empleado es ROTANTE y no existe fila de asignación. */
  findPendingDays(
    tenantId: string,
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<PendingAssignmentDay[]>;
  /** Elimina únicamente asignaciones con source = MANUAL; null si no existe o no es MANUAL. */
  deleteManual(tenantId: string, id: string): Promise<DailyAssignmentRecord | null>;
  /** null si el empleado no existe/fue eliminado — el caller decide cómo tratarlo. */
  findEmployeeCostCenter(tenantId: string, employeeId: string): Promise<CostCenter | null>;
  /** Empleados activos con costCenter = ROTANTE — base para la pantalla de corrección masiva. */
  findRotanteEmployees(tenantId: string): Promise<Array<{ id: string; name: string }>>;
  /** Valida que la sede pertenezca al tenant y esté activa (task-06 AC). */
  findActiveLocationInTenant(
    tenantId: string,
    locationId: string,
  ): Promise<{ id: string; name: string } | null>;
}

// ── Service contract ────────────────────────────────────────────────────────

export interface ResolveFromShiftInput {
  tenantId: string;
  employeeId: string;
  workDate: Date;
  locationId: string;
  shiftId: string;
}

export interface ResolveFromAttendanceInput {
  tenantId: string;
  employeeId: string;
  eventDate: Date;
  locationId: string;
}

export interface AssignManualInput {
  tenantId: string;
  employeeId: string;
  date: Date;
  locationId: string;
  actorUserId: string;
}

export interface EmployeeCalendarDay {
  date: Date;
  locationId: string | null;
  locationName: string | null;
  source: AssignmentSource | null;
  isPending: boolean;
}

export interface PendingAssignmentForTenant {
  employeeId: string;
  employeeName: string;
  date: Date;
  /** Sede sugerida a partir de una fila parcial (ej. turno sin confirmar), si existe. */
  suggestedLocationId: string | null;
}

export interface IDailyCostCenterService {
  /** Llamado desde el hook CONN-03 al confirmar/asignar turno con sede. Skip silencioso si el empleado no es ROTANTE. */
  resolveFromShift(input: ResolveFromShiftInput): Promise<DailyAssignmentRecord | null>;
  /** Llamado desde el hook CONN-01 tras registrar marcación con sede identificable. */
  resolveFromAttendance(input: ResolveFromAttendanceInput): Promise<DailyAssignmentRecord | null>;
  /** Corrección manual (RBAC validado por el caller); siempre gana sobre fuentes automáticas. */
  assignManual(input: AssignManualInput): Promise<DailyAssignmentRecord>;
  listForEmployeeCalendar(
    tenantId: string,
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<EmployeeCalendarDay[]>;
  listPendingForTenant(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<PendingAssignmentForTenant[]>;
  /** Elimina una asignación MANUAL (task-06); null si no existe o no es MANUAL. */
  deleteManual(tenantId: string, id: string): Promise<DailyAssignmentRecord | null>;
}
