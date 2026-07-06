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
