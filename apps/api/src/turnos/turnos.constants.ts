import { SYSTEM_ADMIN_ROLES } from '../common/config/rbac.config';

export const TURNOS_READ_PERMISSION = 'attendance.turnos.read';
export const TURNOS_WRITE_PERMISSION = 'attendance.turnos.write';

/** OS-582 follow-up — alineado con attendance.turnos.read sembrado para MANAGER/NOMINA. */
export const TURNOS_READ_ROLES = [
  ...SYSTEM_ADMIN_ROLES,
  'SUPERVISOR',
  'MANAGER',
  'NOMINA',
] as const;
export const TURNOS_WRITE_ROLES = [...SYSTEM_ADMIN_ROLES] as const;

// OS-582 — Asignación de Turnos
export const TURNO_ASSIGNMENTS_READ_PERMISSION = 'attendance.turnos.assignment.read';
export const TURNO_ASSIGNMENTS_WRITE_PERMISSION = 'attendance.turnos.assignment.write';

/** SUPERVISOR/MANAGER quedan restringidos a sus sedes (UserLocation) en el service. NOMINA es lectura tenant-wide. */
export const TURNO_ASSIGNMENTS_READ_ROLES = [
  ...SYSTEM_ADMIN_ROLES,
  'SUPERVISOR',
  'MANAGER',
  'NOMINA',
] as const;
export const TURNO_ASSIGNMENTS_WRITE_ROLES = [
  ...SYSTEM_ADMIN_ROLES,
  'SUPERVISOR',
  'MANAGER',
] as const;

/** Roles que pueden asignar/eliminar en fechas pasadas sin restricción. */
export const TURNO_ASSIGNMENTS_PAST_DATE_OVERRIDE_ROLES = [...SYSTEM_ADMIN_ROLES] as const;

/** Roles cuyo acceso queda acotado a las sedes asignadas vía UserLocation. */
export const TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES = ['SUPERVISOR', 'MANAGER'] as const;

// CONN-12 — Aprobación semanal de malla (WeeklyShiftPlan)
/** Lectura/escritura del plan reutiliza permisos de asignación (sin seed nuevo en este task). */
export const WEEKLY_SHIFT_PLAN_READ_PERMISSION = TURNO_ASSIGNMENTS_READ_PERMISSION;
export const WEEKLY_SHIFT_PLAN_WRITE_PERMISSION = TURNO_ASSIGNMENTS_WRITE_PERMISSION;
export const WEEKLY_SHIFT_PLAN_READ_ROLES = TURNO_ASSIGNMENTS_READ_ROLES;
export const WEEKLY_SHIFT_PLAN_SUBMIT_ROLES = TURNO_ASSIGNMENTS_WRITE_ROLES;
/**
 * D2: aprueba/rechaza el gerente de operaciones (`MANAGER`) + admins.
 * SUPERVISOR puede armar/enviar, no aprobar.
 */
export const WEEKLY_SHIFT_PLAN_APPROVE_ROLES = [...SYSTEM_ADMIN_ROLES, 'MANAGER'] as const;

export const WEEKLY_SHIFT_PLAN_INVALID_TRANSITION_MESSAGE =
  'Transición de estado del plan semanal no permitida';
export const WEEKLY_SHIFT_PLAN_APPROVE_FORBIDDEN_MESSAGE =
  'Solo el gerente de operaciones puede aprobar o rechazar la planeación semanal';
export const WEEKLY_SHIFT_PLAN_REJECT_REASON_REQUIRED_MESSAGE =
  'El motivo de rechazo es obligatorio';
/** CONN-12 task-03: malla APPROVED bloquea edición salvo same-day. */
export const WEEKLY_SHIFT_PLAN_LOCKED_MESSAGE =
  'La planeación semanal de esta sede está aprobada. Solo se permite modificar el día de hoy (contingencia) o reabrir el plan.';
export const WEEKLY_SHIFT_PLAN_LOCATION_REQUIRED_MESSAGE =
  'No se puede determinar la sede del plan semanal para esta asignación';

export const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const TURNO_EXPORT_COLUMNS = [
  'Nombre',
  'Sigla',
  'Tipo',
  'Jornada',
  'Hora Inicio',
  'Hora Fin',
  'Estado',
] as const;

/** Mensajes de ForbiddenException lanzados por TurnoAssignmentsService.
 * Exportados para que el import masivo (OS-583) pueda clasificar el motivo
 * de un rechazo sin duplicar la regla de negocio ni frágil string-matching ad-hoc. */
export const SCOPE_FORBIDDEN_MESSAGE =
  'El colaborador no pertenece a una sede asignada a este usuario';
export const PAST_DATE_FORBIDDEN_MESSAGE = 'No se pueden modificar asignaciones de fechas pasadas';

// OS-583 — Asignación masiva de Turnos
export const BULK_TEMPLATE_MAX_RANGE_DAYS = 90;
export const BULK_IMPORT_MAX_ASSIGNMENTS = 5000;
export const BULK_IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const BULK_IMPORT_SHEET_NAME = 'Turnos';
export const BULK_AVAILABLE_TURNOS_SHEET_NAME = 'Turnos Disponibles';
export const BULK_BASE_VALUE = 'BASE';
export const BULK_REST_VALUE = 'DESCANSO';
export const BULK_REST_VALUE_ALIASES = ['DESCANSO', 'REST'] as const;

export const BULK_TEMPLATE_COLUMNS = {
  documento: 'Documento',
  nombre: 'Nombre Colaborador',
  employeeId: 'Employee ID',
} as const;

export const BULK_AVAILABLE_TURNOS_COLUMNS = [
  'Nombre',
  'Sigla',
  'Hora Inicio',
  'Hora Fin',
  'Jornada',
] as const;
