import { SYSTEM_ADMIN_ROLES } from '../common/config/rbac.config';

export const TURNOS_READ_PERMISSION = 'attendance.turnos.read';
export const TURNOS_WRITE_PERMISSION = 'attendance.turnos.write';

export const TURNOS_READ_ROLES = [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR'] as const;
export const TURNOS_WRITE_ROLES = [...SYSTEM_ADMIN_ROLES] as const;

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
