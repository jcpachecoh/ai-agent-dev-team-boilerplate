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
